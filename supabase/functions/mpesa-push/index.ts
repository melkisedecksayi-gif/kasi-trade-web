// POST /functions/v1/mpesa-push
// M-Pesa Open API — C2B single stage (Sandbox)
// Hifadhi: pending_payments (production schema, user_id-keyed)
// Jibu la haraka (200) hurudi mara moja browser; kazi ya Vodacom (getSession
// + c2bPayment) inaendelea NYUMA YA PAZIA kwa EdgeRuntime.waitUntil() ili
// browser ianze kua mpesa-status bila kusubiri 502/timeout.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { publicEncrypt, constants } from "node:crypto";

const API_KEY = Deno.env.get("VODACOM_API_KEY") ?? "";
const PUBLIC_KEY = Deno.env.get("VODACOM_PUBLIC_KEY") ?? "";
const SHORTCODE = Deno.env.get("VODACOM_SHORTCODE") ?? "000000";
const BASE_URL = "https://openapi.m-pesa.com/sandbox/ipg/v2/vodafoneGHA";
const PRO_DAYS = 30;

// SessionID mpya mara nyingi "haijaiva" mara moja: tunatuma c2b mara moja,
// kisha kurudia kwa 5s, 10s, 15s ikiwa SessionID bado haiko tayari.
const RETRY_DELAYS_MS = [5000, 10000, 15000];

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// RSA-encrypt API key kwa public key (PKCS#1 v1.5) → base64
function encryptApiKey(): string {
  const pem = PUBLIC_KEY.includes("BEGIN")
    ? PUBLIC_KEY
    : `-----BEGIN PUBLIC KEY-----\n${PUBLIC_KEY.match(/.{1,64}/g)?.join("\n") ?? PUBLIC_KEY}\n-----END PUBLIC KEY-----`;
  return publicEncrypt(
    { key: pem, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(API_KEY, "utf8"),
  ).toString("base64");
}

// 0712345678 / 712345678 / 255712345678 → 255712345678
function normalizePhone(raw: string): string | null {
  const d = String(raw || "").replace(/[\s\-()]/g, "");
  if (/^255\d{9}$/.test(d)) return d;
  if (/^0\d{9}$/.test(d)) return `255${d.slice(1)}`;
  if (/^[78]\d{8}$/.test(d)) return `255${d}`;
  return null;
}

type SupaAdmin = ReturnType<typeof createClient>;

type ChargeParams = {
  admin: SupaAdmin;
  paymentId: string;
  phone: string;
  amount: number;
  thirdPartyId: string;
};

function isSessionNotReady(status: number, body: Record<string, unknown>): boolean {
  if (status === 401) return true;
  const code = String(body.output_ResponseCode ?? body.ResponseCode ?? "");
  const desc = String(body.output_ResponseDesc ?? body.ResponseDesc ?? "");
  return code === "INS-6" || /session/i.test(desc);
}

// Kazi NYUMA YA PAZIA: hupata SessionID, hutuma c2bPayment (retry 5/10/15),
// kisha husasisha pending_payments. Hakuna Response hapa — hulaza DB tu.
async function chargeVodacom({ admin, paymentId, phone, amount, thirdPartyId }: ChargeParams): Promise<void> {
  try {
    // ---- 1. getSession: Authorization: Bearer <RSA(API_KEY) base64> ----
    const sessionRes = await fetch(`${BASE_URL}/getSession/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${encryptApiKey()}`,
        Origin: "*",
      },
    });
    const sessionBody = await sessionRes.json().catch(() => ({}));
    const sessionId = sessionBody.output_SessionID ?? sessionBody.SessionID;
    if (!sessionId) {
      console.error("mpesa-push: SessionID haipatikani", sessionBody);
      await admin.from("pending_payments").update({ status: "failed" }).eq("id", paymentId);
      return;
    }

    // ---- 2. c2bPayment/singleStage: mara moja, kisha retry 5s/10s/15s ----
    let c2bBody: Record<string, unknown> = {};
    let sessionNotReady = false;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
      }
      const c2bRes = await fetch(`${BASE_URL}/c2bPayment/singleStage/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
          Origin: "*",
        },
        body: JSON.stringify({
          input_Amount: String(amount),
          input_Country: "TZA",
          input_Currency: "TZS",
          input_CustomerMSISDN: phone,
          input_ServiceProviderCode: SHORTCODE,
          input_ThirdPartyConversationID: thirdPartyId,
          input_TransactionReference: `KT${Date.now().toString(36).toUpperCase()}`,
          input_PurchasedItemsDesc: "Duka POS Subscription",
        }),
      });
      c2bBody = await c2bRes.json().catch(() => ({}));
      sessionNotReady = isSessionNotReady(c2bRes.status, c2bBody);
      if (!sessionNotReady) break;
    }

    if (sessionNotReady) {
      console.error("mpesa-push: SessionID bado haijawa tayari baada ya retry zote", c2bBody);
      await admin.from("pending_payments").update({ status: "failed" }).eq("id", paymentId);
      return;
    }

    const ok = String(c2bBody.output_ResponseCode ?? c2bBody.ResponseCode ?? "") === "INS-0";
    const providerReceipt =
      c2bBody.TransactionID ?? c2bBody.output_TransactionID ?? null;

    await admin
      .from("pending_payments")
      .update({
        provider_receipt: providerReceipt,
        ...(ok ? {} : { status: "failed" }),
      })
      .eq("id", paymentId);

    if (!ok) {
      console.error("mpesa-push: Vodacom imekataa ombi la malipo", c2bBody);
    }
    console.log(`mpesa-push: kazi ya Vodacom imekamilika nyuma ya pazia (paymentId=${paymentId}, ok=${ok}, receipt=${providerReceipt})`);
  } catch (e) {
    console.error("mpesa-push: kazi imefeli nyuma ya pazia", e);
    try {
      await admin.from("pending_payments").update({ status: "failed" }).eq("id", paymentId);
    } catch {
      // DB update nayo imefeli — kosa limeandikwa console tayari
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!API_KEY || !PUBLIC_KEY) {
    return json({ error: "VODACOM_API_KEY / VODACOM_PUBLIC_KEY hazijawekwa" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Huna ruhusa" }, 401);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Huna ruhusa" }, 401);
  const userId = userData.user.id;

  let body: { phone?: string; amount?: number } = {};
  try { body = await req.json(); } catch { return json({ error: "JSON si sahihi" }, 400); }

  const phone = normalizePhone(body.phone ?? "");
  if (!phone) return json({ error: "Namba ya simu si sahihi (mfano: 0712345678)" }, 400);

  const amount = Number(body.amount ?? Deno.env.get("MPESA_AMOUNT") ?? 12000);
  if (!Number.isFinite(amount) || amount <= 0) {
    return json({ error: "Kiasi si sahihi" }, 400);
  }

  const thirdPartyId = crypto.randomUUID();

  // Hifadhi malipo kama pending MARA MOJA — paymentId huratorudi browser
  // ili ianze kua mpesa-status kabla ya kazi ya Vodacom.
  const { data: payment, error: payErr } = await admin
    .from("pending_payments")
    .insert({
      reference: thirdPartyId,
      user_id: userId,
      phone,
      amount,
      days: PRO_DAYS,
      status: "pending",
      provider: "mpesa",
    })
    .select("id")
    .single();
  if (payErr || !payment) {
    return json({ error: "Imeshindwa kuhifadhi malipo", detail: payErr?.message }, 500);
  }

  // Kazi ya Vodacom iendelee nyuma ya pazia baada ya jibu kurudi.
  console.log(`mpesa-push: accepted (paymentId=${payment.id}) — kazi ya Vodacom inaendelea nyuma ya pazia`);
  const backgroundTask = chargeVodacom({
    admin,
    paymentId: payment.id,
    phone,
    amount,
    thirdPartyId,
  });
  const edgeRuntime = (globalThis as {
    EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void };
  }).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(backgroundTask);
  } else {
    // Runtime isiyoinunga EdgeRuntime: shikilia ahadi isiweze kusahauliwa.
    backgroundTask.catch((e) => console.error("mpesa-push: background error", e));
  }

  return json({
    status: "accepted",
    paymentId: payment.id,
    thirdPartyId,
    amount,
    phone,
    message: "Ombi limepokelewa. Thibitisha M-Pesa prompt kwenye simu yako.",
  });
});
