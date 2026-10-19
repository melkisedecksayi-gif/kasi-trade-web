// POST /functions/v1/mpesa-callback
// Vodacom Open API result callback (weka ResultURL ya function hii kwenye portal)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/vodacom.ts";

const PRO_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false }, 400);
  }

  const thirdPartyId = String(
    body.output_ThirdPartyConversationID ?? body.ThirdPartyConversationID ?? "",
  );
  if (!thirdPartyId) return json({ ok: false }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: payment } = await admin
    .from("pending_payments")
    .select("id, user_id, amount, status, provider_receipt")
    .eq("reference", thirdPartyId)
    .maybeSingle();
  if (!payment) return json({ ok: true });

  const ok = String(body.output_ResponseCode ?? body.ResponseCode ?? "") === "INS-0";
  const status = ok ? "completed" : "failed";
  const receipt =
    String(body.TransactionID ?? body.output_TransactionID ?? "") ||
    payment.provider_receipt ||
    null;

  if (payment.status !== "completed") {
    await admin
      .from("pending_payments")
      .update({
        status,
        provider_receipt: receipt,
        ...(ok ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq("id", payment.id);
  }

  if (ok) {
    const { data: existing } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", payment.user_id)
      .maybeSingle();

    const base =
      existing?.subscription_end && new Date(existing.subscription_end) > new Date()
        ? new Date(existing.subscription_end)
        : new Date();
    const subscriptionEnd = new Date(base.getTime() + PRO_DAYS * 24 * 60 * 60 * 1000);

    await admin
      .from("subscriptions")
      .upsert(
        {
          user_id: payment.user_id,
          plan: existing?.plan ?? "monthly",
          status: "active",
          trial_start: existing?.trial_start ?? null,
          trial_end: existing?.trial_end ?? null,
          subscription_start: existing?.subscription_start ?? new Date().toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
          amount: payment.amount ?? 12000,
          payment_method: "mpesa",
          payment_reference: receipt,
          payment_status: "paid",
        },
        { onConflict: "user_id" },
      );
  }

  return json({ ok: true });
});
