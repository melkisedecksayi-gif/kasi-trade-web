// POST /functions/v1/azampay-status   { paymentId }
// Hali ya malipo kwa mteja anayefanya polling.
//
// AzamPay: chanzo cha ukweli ni `azampay-callback` (inaandika completed/failed kwenye
// pending_payments na kuwasha subscription). Function hii inasoma DB tu — haipigi
// AzamPay, kwa sababu hakuna endpoint ya "collection status" iliyothibitishwa kwenye
// nyaraka za AzamPay (gettransactionstatus ni ya disbursement).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/common.ts";

const PENDING_TIMEOUT_MS = 10 * 60 * 1000;

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

  const { data: payment, error: payErr } = await admin
    .from("pending_payments")
    .select("id, user_id, status, failure_reason, created_at")
    .eq("id", body.paymentId)
    .maybeSingle();
  if (payErr) {
    console.error("azampay-status: query imeshindwa", payErr);
    return json({ error: "Hitilafu ya seva. Jaribu tena." }, 500);
  }
  if (!payment) return json({ error: "Malipo hayapo" }, 404);
  if (payment.user_id !== userId) return json({ error: "Huna ruhusa" }, 403);

  if (payment.status === "completed") {
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return json({ status: "completed", subscription: subscription ?? null });
  }

  if (payment.status === "failed") {
    return json({
      status: "failed",
      reason: payment.failure_reason ?? "Malipo hayakukamilika.",
      subscription: null,
    });
  }

  // Pending kwa muda mrefu mno: mteja hakuidhinisha au prompt haikufika. Weka failed ili
  // aweze kujaribu tena. Salama: `complete_payment` bado inakubali malipo yaliyo `failed`,
  // kwa hiyo callback ya kuchelewa ikija itamalizia na kuwasha usajili.
  const ageMs = Date.now() - new Date(payment.created_at).getTime();
  if (ageMs > PENDING_TIMEOUT_MS) {
    const reason = "Muda wa malipo umeisha. Jaribu tena na uthibitishe ombi kwenye simu yako.";
    await admin
      .from("pending_payments")
      .update({ status: "failed", failure_reason: reason })
      .eq("id", payment.id)
      .eq("status", "pending");
    return json({ status: "failed", reason, subscription: null });
  }

  return json({ status: "pending", subscription: null });
});
