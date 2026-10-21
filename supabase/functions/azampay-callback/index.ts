// POST /functions/v1/azampay-callback
// Callback ya AzamPay baada ya mteja kuidhinisha (au kukataa) malipo.
// Deploy: supabase functions deploy azampay-callback --no-verify-jwt
// Callback URL (weka kwenye portal ya AzamPay):
//   https://<project-ref>.supabase.co/functions/v1/azampay-callback
//
// Payload (herufi ndogo): { message, password, clientId, transactionstatus,
//   operator, reference, externalreference, utilityref, amount, transid, msisdn, ... }
// Muhimu: `utilityref` = externalId yetu; `externalreference` = transactionId ya AzamPay.
//
// USALAMA (tabaka mbili):
//  1. `password` kwenye mwili lazima ilingane na AZAMPAY_CALLBACK_PASSWORD (uliyoweka
//     kwenye portal). Kwenye production ikikosekana -> 503 (fail-closed).
//  2. `utilityref` (externalId) ni siri isiyotumwa kwa client (SUB-<ts>-<random>), kwa hiyo
//     callback ya uongo haiwezi kulenga malipo ya mtu. Kwenye sandbox (ambako AzamPay
//     inaweza kutotuma password) hii ndiyo ulinzi mkuu.
// Kiasi lazima kisipungue kilichotakiwa. Kuwasha kunafanywa na `complete_payment`
// (atomic + idempotent), kwa hiyo callback ikirudiwa haiongezi siku.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AZAMPAY_ENV, azampayClientId } from "../_shared/azampay.ts";
import { corsHeaders, json, safeEqual } from "../_shared/common.ts";

const CALLBACK_PASSWORD = Deno.env.get("AZAMPAY_CALLBACK_PASSWORD") ?? "";

// Soma field bila kujali herufi kubwa/ndogo
function field(body: Record<string, unknown>, key: string): string {
  const k = Object.keys(body).find((x) => x.toLowerCase() === key.toLowerCase());
  const v = k ? body[k] : undefined;
  return v === undefined || v === null ? "" : String(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ success: false }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Rekodi ya ukaguzi: kila callback inayoingia (password imefichwa). Ni "best effort" —
  // kushindwa kwake hakuathiri usindikaji. Inasaidia kujua kama AzamPay iliita kabisa.
  const safeBody: Record<string, unknown> = { ...body };
  for (const k of Object.keys(safeBody)) {
    if (k.toLowerCase() === "password") safeBody[k] = "[redacted]";
  }
  let auditId: string | null = null;
  try {
    const { data: row } = await admin
      .from("payment_callbacks")
      .insert({ provider: "azampay", body: safeBody, outcome: "received" })
      .select("id")
      .single();
    auditId = row?.id ?? null;
  } catch (e) {
    console.warn("azampay-callback: audit insert imeshindwa", e);
  }
  const finish = async (outcome: string, res: Response): Promise<Response> => {
    if (auditId) {
      try {
        await admin.from("payment_callbacks").update({ outcome }).eq("id", auditId);
      } catch { /* best effort */ }
    }
    return res;
  };

  // ---- 1. Uthibitisho wa chanzo ----
  const gotPassword = field(body, "password");
  if (CALLBACK_PASSWORD) {
    if (!safeEqual(gotPassword, CALLBACK_PASSWORD)) {
      console.error("azampay-callback: password si sahihi");
      return finish("rejected: password si sahihi", json({ success: false }, 401));
    }
  } else if (AZAMPAY_ENV === "production") {
    console.error("azampay-callback: AZAMPAY_CALLBACK_PASSWORD haijawekwa — production inakataa");
    return finish("rejected: password haijasanidiwa (production)", json({ success: false, error: "Callback haijasanidiwa" }, 503));
  } else {
    console.warn("azampay-callback: sandbox bila AZAMPAY_CALLBACK_PASSWORD (inategemea utilityref ya siri)");
  }

  const clientId = field(body, "clientId");
  if (clientId && azampayClientId && !safeEqual(clientId, azampayClientId)) {
    console.error("azampay-callback: clientId hailingani");
    return finish("rejected: clientId hailingani", json({ success: false }, 401));
  }

  const txStatus = field(body, "transactionstatus").toLowerCase();

  // AzamPay HAIRUDISHI `externalId` yetu kwenye `externalreference`. Kwenye callback halisi:
  //   utilityref        = externalId tuliyotuma (SUB-<ts>-<random>)
  //   externalreference = transactionId ya AzamPay (sawa na `reference` / `transid`)
  // Kwa hiyo tunatafuta kwa utilityref kwanza, kisha externalreference (kwa tahadhari),
  // kisha kwa transactionId tuliyohifadhi wakati wa checkout.
  const externalCandidates = [field(body, "utilityref"), field(body, "externalreference")].filter(Boolean);
  const txIdCandidates = [
    field(body, "reference"),
    field(body, "transid"),
    field(body, "externalreference"),
  ].filter(Boolean);
  if (externalCandidates.length === 0 && txIdCandidates.length === 0) {
    console.error("azampay-callback: hakuna utilityref/externalreference; keys =", Object.keys(body).join(","));
    return finish("rejected: utilityref/externalreference haipo", json({ success: false }, 400));
  }

  type PaymentLookup = { id: string; amount: number; status: string };
  let payment: PaymentLookup | null = null;
  let pErr: unknown = null;

  if (externalCandidates.length > 0) {
    const r = await admin
      .from("pending_payments")
      .select("id, amount, status")
      .in("external_id", externalCandidates)
      .limit(1)
      .maybeSingle();
    payment = r.data as PaymentLookup | null;
    pErr = r.error;
  }
  if (!payment && !pErr && txIdCandidates.length > 0) {
    const r = await admin
      .from("pending_payments")
      .select("id, amount, status")
      .in("provider_response->checkout->>transactionId", txIdCandidates)
      .limit(1)
      .maybeSingle();
    payment = r.data as PaymentLookup | null;
    pErr = r.error;
  }
  if (pErr) {
    console.error("azampay-callback: query imeshindwa", pErr);
    return finish("error: query imeshindwa", json({ success: false }, 500)); // AzamPay ijaribu tena
  }
  // Jibu sawa kwa reference isiyojulikana ili kutofichua kama ipo.
  if (!payment) return finish("ignored: malipo hayapatikani (utilityref/transactionId)", json({ success: true }));
  if (payment.status === "completed") return finish("ignored: tayari completed", json({ success: true, note: "already completed" }));

  // ---- 2. Matokeo ----
  if (txStatus === "success") {
    const paid = Number(field(body, "amount"));
    if (Number.isFinite(paid) && paid > 0 && paid < Number(payment.amount)) {
      console.error("azampay-callback: kiasi kidogo", { paid, expected: payment.amount });
      await admin
        .from("pending_payments")
        .update({
          status: "failed",
          failure_reason: "Kiasi kilicholipwa hakilingani na bei ya usajili. Wasiliana na msaada.",
          provider_response: { callback: safeBody },
        })
        .eq("id", payment.id)
        .eq("status", "pending");
      return finish("failed: kiasi kidogo", json({ success: true }));
    }

    // Risiti ya mtandao wa simu kama ipo (transid > mnoreference > reference)
    const receipt =
      field(body, "transid") || field(body, "mnoreference") || field(body, "reference") || null;

    const { error: rpcErr } = await admin.rpc("complete_payment", {
      p_payment_id: payment.id,
      p_receipt: receipt,
    });
    if (rpcErr) {
      console.error("azampay-callback: complete_payment imeshindwa", rpcErr);
      return finish("error: complete_payment imeshindwa", json({ success: false }, 500)); // AzamPay ijaribu tena
    }
    await admin
      .from("pending_payments")
      .update({ provider_response: { callback: safeBody } })
      .eq("id", payment.id);
    return finish("completed", json({ success: true }));
  }

  if (txStatus === "failure" || txStatus === "failed" || txStatus === "fail" || txStatus === "cancelled") {
    await admin
      .from("pending_payments")
      .update({
        status: "failed",
        failure_reason: "Malipo hayakukamilika. Huenda umeghairi au salio halitoshi.",
        provider_response: { callback: safeBody },
      })
      .eq("id", payment.id)
      .eq("status", "pending");
    return finish("failed: AzamPay ilitaarifu kushindwa", json({ success: true }));
  }

  // Hali nyingine (mfano pending) — hakuna cha kufanya.
  console.log(`azampay-callback: hali isiyojulikana "${txStatus}" (paymentId=${payment.id})`);
  return finish(`ignored: transactionstatus="${txStatus}" haijulikani`, json({ success: true }));
});
