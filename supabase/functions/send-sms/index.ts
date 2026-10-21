// POST /functions/v1/send-sms
// Kituo KIMOJA cha kutuma SMS (meseji.co.tz). API key ipo kwenye secrets pekee:
//   supabase secrets set MESEJI_API_KEY=... [MESEJI_SENDER_ID=KasiTRADE]
//
// Body: { kind, to, ... }
//  Bila login (kabla ya mtumiaji kuingia) — seva ndiyo inatengeneza ujumbe, mteja hawezi
//  kutuma maandishi yake mwenyewe:
//    kind: "otp"            { to, code, lang }
//    kind: "password_reset" { to, code, lang }
//    kind: "welcome"        { to, businessName, lang }
//  Na login (JWT ya mtumiaji halisi, si anon key):
//    kind: "custom"         { to, message }
//
// Vikwazo: kikomo cha kasi kwa namba / IP / mtumiaji (jedwali sms_send_attempts),
// namba za Tanzania pekee, urefu wa ujumbe <= 640.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, normalizeTzPhone } from "../_shared/common.ts";

const API_URL = "https://meseji.co.tz/api/v1/sms/send";
const API_KEY = Deno.env.get("MESEJI_API_KEY") ?? "";
const SENDER_ID = Deno.env.get("MESEJI_SENDER_ID") ?? "KasiTRADE";
const MAX_MESSAGE_LEN = 640;

const WINDOW_MS = 10 * 60 * 1000;
const LIMITS = {
  anonPerPhone: 5, // OTP/welcome kwa namba moja kwa dakika 10
  anonPerIp: 20, // kwa IP moja kwa dakika 10
  userPerPhone: 10, // kwa namba moja kwa dakika 10
  userPerHour: 300, // kwa mtumiaji kwa saa 1 (bulk SMS kwa wateja)
};

type Lang = "sw" | "en";
const TEMPLATES = {
  welcome: {
    sw: (name: string) =>
      `Hongera ${name}! Karibu kwenye familia ya KasiTRADE POS. Furahia siku 14 za majaribio BURE. Mfumo wetu utakusaidia kudhibiti biashara yako kwa ufanisi. Tuko pamoja!`,
    en: (name: string) =>
      `Congratulations ${name}! Welcome to KasiTRADE POS family. Enjoy 14 days FREE trial. Our system will help you manage your business efficiently. We are with you!`,
  },
  otp: {
    sw: (code: string) =>
      `Namba yako ya uhakiki (OTP) ni: ${code}. Usimpe mtu yeyote namba hii. Itaisha baada ya dakika 5. - KasiTRADE`,
    en: (code: string) =>
      `Your verification code (OTP) is: ${code}. Do not share this code with anyone. It expires in 5 minutes. - KasiTRADE`,
  },
  password_reset: {
    sw: (code: string) =>
      `Namba yako ya kubadilisha nenosiri ni: ${code}. Usimpe mtu yeyote. Itaisha baada ya dakika 5. - KasiTRADE`,
    en: (code: string) =>
      `Your password reset code is: ${code}. Do not share it. Expires in 5 minutes. - KasiTRADE`,
  },
};

const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

async function countSince(
  admin: ReturnType<typeof createClient>,
  column: "phone" | "ip" | "user_id",
  value: string,
  sinceMs: number,
): Promise<number> {
  const since = new Date(Date.now() - sinceMs).toISOString();
  const { count, error } = await admin
    .from("sms_send_attempts")
    .select("id", { count: "exact", head: true })
    .eq(column, value)
    .gte("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  if (!API_KEY) {
    console.error("send-sms: MESEJI_API_KEY haijawekwa");
    return json({ success: false, error: "Huduma ya SMS haijasanidiwa" }, 500);
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ success: false, error: "JSON si sahihi" }, 400); }

  const kind = String(body.kind ?? "");
  const to = normalizeTzPhone(String(body.to ?? ""));
  if (!to) return json({ success: false, error: "Namba ya simu si sahihi" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Je, mwito una mtumiaji halisi aliyeingia? (anon key haihesabiki)
  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (token) {
    const { data } = await admin.auth.getUser(token);
    userId = data?.user?.id ?? null;
  }

  // ---- Ujumbe ----
  const lang: Lang = body.lang === "en" ? "en" : "sw";
  let message = "";
  if (kind === "otp" || kind === "password_reset") {
    const code = clean(body.code, 10);
    if (!/^\d{4,8}$/.test(code)) return json({ success: false, error: "Code si sahihi" }, 400);
    message = TEMPLATES[kind][lang](code);
  } else if (kind === "welcome") {
    message = TEMPLATES.welcome[lang](clean(body.businessName, 60) || "KasiTRADE");
  } else if (kind === "custom") {
    if (!userId) return json({ success: false, error: "Huna ruhusa" }, 401);
    message = String(body.message ?? "").trim();
    if (!message) return json({ success: false, error: "Ujumbe unahitajika" }, 400);
    if (message.length > MAX_MESSAGE_LEN) {
      return json({ success: false, error: `Ujumbe ni mrefu mno (max ${MAX_MESSAGE_LEN})` }, 400);
    }
  } else {
    return json({ success: false, error: "kind si sahihi" }, 400);
  }

  // ---- Kikomo cha kasi ----
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  try {
    if ((await countSince(admin, "phone", to, WINDOW_MS)) >= (userId ? LIMITS.userPerPhone : LIMITS.anonPerPhone)) {
      return json({ success: false, error: "Jumbe nyingi mno kwa namba hii. Subiri kidogo." }, 429);
    }
    if (userId) {
      if ((await countSince(admin, "user_id", userId, 60 * 60 * 1000)) >= LIMITS.userPerHour) {
        return json({ success: false, error: "Umefikia kikomo cha SMS kwa saa. Jaribu baadaye." }, 429);
      }
    } else if (ip && (await countSince(admin, "ip", ip, WINDOW_MS)) >= LIMITS.anonPerIp) {
      return json({ success: false, error: "Maombi mengi mno. Jaribu baadaye." }, 429);
    }

    await admin.from("sms_send_attempts").insert({ kind, phone: to, ip, user_id: userId });
    // Usafishaji wa rekodi za zamani (kila ombi ~2%)
    if (Math.random() < 0.02) {
      await admin.from("sms_send_attempts").delete().lt("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    }
  } catch (e) {
    // Kikwazo hakifanyi kazi -> usitume (salama zaidi kuliko kuacha wazi)
    console.error("send-sms: rate limit check imeshindwa", e);
    return json({ success: false, error: "Hitilafu ya seva. Jaribu tena." }, 500);
  }

  // ---- Tuma kupitia meseji.co.tz ----
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ sender_id: SENDER_ID, message, contacts: to }),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!res.ok) {
      const d = data as { message?: string; error?: string };
      console.error("send-sms: meseji imekataa", res.status, text.slice(0, 300));
      return json({ success: false, error: d?.message || d?.error || `HTTP ${res.status}` }, 502);
    }
    return json({ success: true, data });
  } catch (e) {
    console.error("send-sms: meseji haipatikani", e);
    const timeout = e instanceof DOMException && e.name === "TimeoutError";
    return json({ success: false, error: timeout ? "Request timeout" : "Huduma ya SMS haipatikani" }, 502);
  }
});
