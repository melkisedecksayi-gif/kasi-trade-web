// KasiTrade SMS V2: fail-closed sender. No public OTP/welcome/marketing endpoints.
// Live is OFF unless SMS_LIVE_ENABLED=true is explicitly configured.
// IMPORTANT: deploy only after reserve_sms_v2_send migration has passed staging tests.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, normalizeTzPhone } from "../_shared/common.ts";
import { classifyProviderResponse, singleSegmentGsm, validSmsKind } from "../_shared/smsSafety.mjs";

const API_URL = "https://meseji.co.tz/api/v1/sms/send";
const API_KEY = Deno.env.get("MESEJI_API_KEY") ?? "";
const SENDER_ID = Deno.env.get("MESEJI_SENDER_ID") ?? "KasiTRADE";
const LIVE = Deno.env.get("SMS_LIVE_ENABLED") === "true";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeText = (v: unknown, max: number) =>
  String(v ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function receiptText(shopName: string, total: number, when: string) {
  const date = new Date(when);
  const dateText = Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  const header = `${safeText(shopName, 36)}: RISITI`;
  return `${header}\nTarehe: ${dateText}\nJumla: TSh ${Math.max(0, total).toLocaleString("en-US")}\nAsante kwa kununua!`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  // No sender can spend Meseji credit unless the operator explicitly enables live.
  if (!LIVE) return json({ success: false, error: "SMS Live imezimwa (dry-run / safety lock)", retryable: false }, 503);
  if (!API_KEY) return json({ success: false, error: "MESEJI_API_KEY haipo", retryable: false }, 503);
  if (!Deno.env.get("SUPABASE_URL") || !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))
    return json({ success: false, error: "Supabase config haijakamilika" }, 503);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ success: false, error: "Login inahitajika" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const userId = authError ? null : authData?.user?.id;
  if (!userId) return json({ success: false, error: "Session batili" }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ success: false, error: "JSON si sahihi" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ success: false, error: "Payload si sahihi" }, 400);
  const kind = String(body.kind ?? "");
  if (!validSmsKind(kind)) return json({ success: false, error: "SMS type haijaruhusiwa" }, 403);
  const shopId = String(body.shop_id ?? "");
  const requestKey = String(body.request_key ?? "");
  const to = normalizeTzPhone(String(body.to ?? ""));
  if (!UUID.test(shopId) || !UUID.test(requestKey) || !to || !/^255[67][0-9]{8}$/.test(to))
    return json({ success: false, error: "shop_id, request_key au namba si sahihi" }, 400);

  // Every interactive SMS must be tied to an owned shop.
  const { data: shop, error: shopErr } = await admin.from("shops")
    .select("id, owner_id, shop_name, phone")
    .eq("id", shopId).eq("owner_id", userId).maybeSingle();
  if (shopErr) return json({ success: false, error: "Shop check imeshindikana" }, 503);
  if (!shop) return json({ success: false, error: "Huna ruhusa kwenye duka hili" }, 403);

  let message = "";
  let purpose = "";
  if (kind === "receipt") {
    purpose = "receipt";
    // Client cannot fabricate the receipt amount or bypass the per-shop OFF switch.
    const { data: setting, error: settingErr } = await admin.from("shop_sms_preferences")
      .select("sale_receipts_enabled").eq("shop_id", shopId).maybeSingle();
    if (settingErr) return json({ success: false, error: "Receipt setting haijasomeka" }, 503);
    if (setting?.sale_receipts_enabled !== true)
      return json({ success: false, error: "Receipt SMS imezimwa kwa duka hili" }, 403);
    const { data: tx, error: txErr } = await admin.from("transactions")
      .select("id, total_amount, created_at")
      .eq("shop_id", shopId).eq("checkout_request_id", requestKey).maybeSingle();
    if (txErr) return json({ success: false, error: "Sale check imeshindikana" }, 503);
    if (!tx) return json({ success: false, error: "Hakuna mauzo halisi kwa request_key hii" }, 403);
    const amount = Number(tx.total_amount);
    if (!Number.isFinite(amount) || amount < 0)
      return json({ success: false, error: "Thamani ya sale si sahihi" }, 503);
    message = receiptText(shop.shop_name, amount, String(tx.created_at));
  } else {
    purpose = String(body.purpose ?? "");
    if (purpose !== "report" && purpose !== "stock_alert")
      return json({ success: false, error: "SMS za wateja/marketing bado hazijaruhusiwa" }, 403);
    // Reports and stock alerts can only go to an owner/shop registered phone.
    const { data: profile, error: profileErr } = await admin.from("profiles")
      .select("phone").eq("id", userId).maybeSingle();
    if (profileErr) return json({ success: false, error: "Phone check imeshindikana" }, 503);
    const allowed = [shop.phone, profile?.phone].map((x) => normalizeTzPhone(String(x ?? ""))).filter(Boolean);
    if (!allowed.includes(to))
      return json({ success: false, error: "Tuma ripoti/tahadhari kwa namba ya duka au mmiliki tu" }, 403);
    message = String(body.message ?? "").trim();
  }
  if (!singleSegmentGsm(message))
    return json({ success: false, error: "SMS iwe GSM-7, segment moja tu (<=160 septets)" }, 400);

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({kind, shopId, to, message, purpose})));
  const hash = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, "0")).join("");

  // Atomic DB reservation: ownership, per-shop OFF, duplicate, hard cap 20 per owner/day.
  const { data: reserved, error: reserveErr } = await admin.rpc("reserve_sms_v2_send", {
    p_user_id: userId, p_shop_id: shopId, p_request_key: requestKey,
    p_payload_hash: hash, p_purpose: purpose,
  });
  if (reserveErr) {
    console.error("SMS reservation failed", reserveErr);
    return json({ success: false, error: "SMS reservation haijakamilika", retryable: false }, 503);
  }
  if (reserved !== "reserved") {
    const code = reserved === "daily_limit" ? 429 : reserved === "unauthorized" ? 403 : 409;
    return json({ success: false, error: `SMS imezuiwa: ${reserved}`, retryable: false }, code);
  }

  const setStatus = async (status: "sent" | "failed" | "unknown", errorCode?: string) => {
    const { error } = await admin.from("sms_idempotency")
      .update({ status, error_code: errorCode ?? null, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("request_key", requestKey).eq("status", "processing");
    if (error) console.error("Failed to store SMS status", error);
  };

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ sender_id: SENDER_ID, message, contacts: to }),
      signal: AbortSignal.timeout(15000),
    });
    const responseText = await resp.text();
    let provider: unknown;
    try { provider = JSON.parse(responseText); } catch { provider = {}; }
    const classified = classifyProviderResponse(resp.ok, provider);
    // 5xx is ambiguous: provider may have sent despite gateway failure.
    const finalStatus = !resp.ok && resp.status < 500 ? "failed" : classified === "accepted" ? "sent" : classified;
    await setStatus(finalStatus, finalStatus === "sent" ? undefined : `PROVIDER_${resp.status}_${finalStatus}`);
    if (finalStatus !== "sent") {
      return json({ success: false, status: finalStatus,
        error: "Meseji haijathibitisha kupokea SMS. Usitume tena kabla ya kukagua.", retryable: false }, 502);
    }
    return json({ success: true, status: "accepted", data: provider });
  } catch (err) {
    console.error("SMS provider connection error", err);
    await setStatus("unknown", "PROVIDER_NETWORK_OR_TIMEOUT");
    return json({ success: false, status: "unknown",
      error: "Hali ya SMS haijulikani; usirudie bila uhakiki", retryable: false }, 502);
  }
});
