// POST /functions/v1/mpesa-status
// Angalia hali ya malipo (queryTransactionStatus) na uwezeshe PRO ikikamilika
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, queryTransactionStatus } from "../_shared/vodacom.ts";

const PRO_DAYS = 30;

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

  let body: { paymentId?: string } = {};
  try { body = await req.json(); } catch { return json({ error: "JSON si sahihi" }, 400); }
  if (!body.paymentId) return json({ error: "paymentId inahitajika" }, 400);

  const { data: payment } = await admin
    .from("pending_payments")
    .select("id, user_id, reference, provider_receipt, status, amount")
    .eq("id", body.paymentId)
    .single();
  if (!payment) return json({ error: "Malipo hayapo" }, 404);
  if (payment.user_id !== userId) return json({ error: "Huna ruhusa" }, 403);

  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (payment.status === "completed") {
    return json({ status: "completed", subscription: existingSub ?? null });
  }

  let result;
  try {
    result = await queryTransactionStatus({
      queryReference: payment.provider_receipt || payment.reference,
      thirdPartyConversationId: payment.reference,
    });
  } catch {
    return json({ status: "pending", subscription: null });
  }

  const statusText = String(result.output_ResponseTransactionStatus ?? "");
  let status: "pending" | "completed" | "failed" = "pending";
  if (/complet|success/i.test(statusText)) status = "completed";
  else if (/fail|cancel|reject|error/i.test(statusText)) status = "failed";

  const receipt =
    result.TransactionID ?? payment.provider_receipt ?? null;

  if (status !== "pending") {
    await admin
      .from("pending_payments")
      .update({
        status,
        provider_receipt: receipt,
        ...(status === "completed" ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq("id", payment.id);
  }

  let subscription = existingSub ?? null;
  if (status === "completed") {
    const base =
      existingSub?.subscription_end && new Date(existingSub.subscription_end) > new Date()
        ? new Date(existingSub.subscription_end)
        : new Date();
    const subscriptionEnd = new Date(base.getTime() + PRO_DAYS * 24 * 60 * 60 * 1000);

    const { data: updated } = await admin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: existingSub?.plan ?? "monthly",
          status: "active",
          trial_start: existingSub?.trial_start ?? null,
          trial_end: existingSub?.trial_end ?? null,
          subscription_start: existingSub?.subscription_start ?? new Date().toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
          amount: payment.amount ?? 12000,
          payment_method: "mpesa",
          payment_reference: receipt,
          payment_status: "paid",
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    subscription = updated ?? subscription;
  }

  return json({ status, subscription });
});
