// POST /functions/v1/azampay-push   { phone, provider }
// AzamPay — wallet zote za TZ: Mpesa | Airtel | Tigo | Halopesa | Azampesa
//
// 1. Thibitisha mtumiaji (JWT) + namba ya simu + mtandao uliochaguliwa
// 2. Hifadhi malipo kama `pending` (external_id ya kipekee) na RUDISHA 200 MARA MOJA
// 3. NYUMA YA PAZIA (EdgeRuntime.waitUntil): pata token ya AzamPay -> mno/checkout
//    (STK/USSD push). Matokeo ya mwisho huja kupitia `azampay-callback`.
//
// Kiasi cha malipo huamuliwa na SERVER (SUBSCRIPTION_AMOUNT, default 12000) — kiasi
// kinachotumwa na frontend kinapuuzwa kwa makusudi ili mtu asilipe TZS 1.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AzamPayAuthError, mnoCheckout } from "../_shared/azampay.ts";
import {
  type AzamPayNetwork,
  corsHeaders,
  json,
  normalizeTzPhone,
  parseNetwork,
  SUBSCRIPTION_AMOUNT,
  SUBSCRIPTION_DAYS,
} from "../_shared/common.ts";

const PROVIDER = "azampay";
// Ombi lililo pending ndani ya dirisha hili hutumika tena (hakuna STK push mbili)
const DUPLICATE_WINDOW_MS = 3 * 60 * 1000;

type SupaAdmin = ReturnType<typeof createClient>;

async function markFailed(admin: SupaAdmin, paymentId: string, reason: string, detail?: unknown) {
  await admin
    .from("pending_payments")
    .update({
      status: "failed",
      failure_reason: reason,
      ...(detail !== undefined ? { provider_response: detail } : {}),
    })
    .eq("id", paymentId)
    .eq("status", "pending");
}

// Kazi NYUMA YA PAZIA — haina Response, huandika DB tu.
async function chargeAzamPay(
  admin: SupaAdmin,
  p: { paymentId: string; phone: string; amount: number; externalId: string; network: AzamPayNetwork },
): Promise<void> {
  try {
    const res = await mnoCheckout({
      accountNumber: p.phone,
      amount: p.amount,
      externalId: p.externalId,
      provider: p.network,
    });

    if (res.ok) {
      // Ombi limekubaliwa; mteja anasubiriwa kuidhinisha kwenye simu. Callback itamalizia.
      await admin
        .from("pending_payments")
        .update({ provider_response: { checkout: res.body } })
        .eq("id", p.paymentId);
      console.log(`azampay-push: checkout imekubaliwa (paymentId=${p.paymentId}, txn=${res.transactionId})`);
      return;
    }

    console.error("azampay-push: AzamPay imekataa checkout", res.httpStatus, res.body);
    await markFailed(admin, p.paymentId, "Imeshindwa kutuma ombi la malipo. Jaribu tena.", {
      http_status: res.httpStatus,
      body: res.body,
    });
  } catch (e) {
    console.error("azampay-push: hitilafu nyuma ya pazia", e);
    if (e instanceof AzamPayAuthError) {
      // Hakuna ombi lililotumwa kwa AzamPay — salama kuweka failed.
      await markFailed(
        admin,
        p.paymentId,
        "Mfumo wa malipo haujasanidiwa vizuri. Wasiliana na msaada.",
        { error: e.message },
      ).catch(() => {});
    }
    // Kosa la mtandao NDANI ya checkout: ombi linaweza kuwa limefika (mteja anaweza
    // kupata prompt). Acha `pending`; callback ikija itamalizia.
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

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

  let body: { phone?: string; provider?: string } = {};
  try { body = await req.json(); } catch { return json({ error: "JSON si sahihi" }, 400); }

  const phone = normalizeTzPhone(body.phone ?? "");
  if (!phone) return json({ error: "Namba ya simu si sahihi (mfano: 0754123456)" }, 400);

  const network = parseNetwork(body.provider);
  if (!network) {
    return json({ error: "Chagua mtandao wa malipo (M-Pesa, Airtel, Tigo, HaloPesa au AzamPesa)" }, 400);
  }

  const amount = SUBSCRIPTION_AMOUNT;
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error("azampay-push: SUBSCRIPTION_AMOUNT si sahihi", amount);
    return json({ error: "Hitilafu ya usanidi wa bei" }, 500);
  }

  // Ombi la hivi karibuni (namba na mtandao ule ule) bado pending? Lirudishe badala ya
  // kutuma prompt nyingine.
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
  const { data: recent } = await admin
    .from("pending_payments")
    .select("id, amount, phone")
    .eq("user_id", userId)
    .eq("status", "pending")
    .eq("phone", phone)
    .eq("network", network)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent) {
    return json({
      status: "accepted",
      paymentId: recent.id,
      amount: recent.amount,
      phone: recent.phone,
      message: "Ombi la awali bado linasubiri. Thibitisha ombi la malipo kwenye simu yako.",
    });
  }

  // externalId: ya kipekee kwa kila muamala (AzamPay huitumia ku-dedupe).
  // Haitumwi kwa client — ni siri inayolinda callback dhidi ya uongo.
  const externalId = `SUB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: payment, error: payErr } = await admin
    .from("pending_payments")
    .insert({
      reference: crypto.randomUUID(),
      external_id: externalId,
      user_id: userId,
      phone,
      amount,
      days: SUBSCRIPTION_DAYS,
      status: "pending",
      provider: PROVIDER,
      network,
    })
    .select("id")
    .single();
  if (payErr || !payment) {
    console.error("azampay-push: insert imeshindwa", payErr);
    return json({ error: "Imeshindwa kuhifadhi malipo", detail: payErr?.message }, 500);
  }

  // Fire-and-forget: kazi ya AzamPay iendelee baada ya jibu kurudi.
  const task = chargeAzamPay(admin, { paymentId: payment.id, phone, amount, externalId, network });
  const edgeRuntime = (globalThis as {
    EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void };
  }).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(task);
  } else {
    task.catch((e) => console.error("azampay-push: background error", e));
  }

  return json({
    status: "accepted",
    paymentId: payment.id,
    amount,
    phone,
    provider: network,
    message: "Ombi limepokelewa. Thibitisha ombi la malipo kwenye simu yako.",
  });
});
