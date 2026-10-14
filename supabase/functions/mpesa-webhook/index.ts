// ============================================================
//  Supabase Edge Function: mpesa-webhook
//  Inapokea callback ya malipo (M-Pesa C2B / aggregator) na
//  kuwasha subscription kwa usalama (service role).
//
//  Deploy:  supabase functions deploy mpesa-webhook --no-verify-jwt
//  Secrets: supabase secrets set MPESA_WEBHOOK_SECRET=xxxx
//           (SUPABASE_URL na SUPABASE_SERVICE_ROLE_KEY zinajulikana)
//
//  Kumbuka: muundo wa payload hutofautiana kwa provider/version.
//  Badilisha sehemu ya `extractPayment` kulingana na API uliyochagua.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('MPESA_WEBHOOK_SECRET') ?? '';
const DEFAULT_DAYS = 30;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type PaymentHit = {
  reference: string;
  receipt?: string;
  amount?: number;
  phone?: string;
};

// Badilisha hapa kulingana na provider wako
function extractPayment(body: any): PaymentHit | null {
  if (!body) return null;
  // Mfano wa M-Pesa C2B (marekebisho yanahitajika kwa version yako)
  const reference =
    body.reference ??
    body.BillRefNumber ??
    body.AccountReference ??
    body.TransID ??
    body.transaction?.reference;
  if (!reference) return null;

  return {
    reference: String(reference),
    receipt: body.receipt ?? body.TransID ?? body.transaction?.receipt,
    amount: Number(body.amount ?? body.TransAmount ?? body.transaction?.amount ?? 0),
    phone: body.msisdn ?? body.Msisdn ?? body.phone ?? body.transaction?.msisdn,
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 1) Thibitisha webhook (shared secret)
    if (WEBHOOK_SECRET) {
      const got =
        req.headers.get('x-webhook-secret') ??
        req.headers.get('authorization')?.replace('Bearer ', '');
      if (got !== WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const body = await req.json();
    const payment = extractPayment(body);
    if (!payment) {
      return new Response('Bad payload', { status: 400 });
    }

    // 2) Tafuta malipo yanayosubiri kwa reference
    const { data: pending, error: pErr } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('reference', payment.reference)
      .eq('status', 'pending')
      .maybeSingle();

    if (pErr) throw pErr;

    // Kama haipo au tayari imelipwa -> idempotent (ruka)
    if (!pending) {
      return new Response(JSON.stringify({ ok: true, note: 'no pending / already paid' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3) Weka malipo kama yamelipwa
    await supabase
      .from('pending_payments')
      .update({
        status: 'paid',
        provider: 'mpesa',
        provider_receipt: payment.receipt ?? null,
        paid_at: new Date().toISOString(),
      })
      .eq('id', pending.id);

    // 4) Washa subscription (server-side; service role inapita RLS)
    const days = pending.days ?? DEFAULT_DAYS;
    const now = new Date();
    const end = new Date(now.getTime() + days * 86400000);

    const { data: existing, error: sErr } = await supabase
      .from('subscriptions')
      .select('id, subscription_end')
      .eq('user_id', pending.user_id)
      .maybeSingle();
    if (sErr) throw sErr;

    if (existing?.id) {
      const base =
        existing.subscription_end && new Date(existing.subscription_end) > now
          ? new Date(existing.subscription_end)
          : now;
      const newEnd = new Date(base.getTime() + days * 86400000);
      const { error: uErr } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          subscription_start: now.toISOString(),
          subscription_end: newEnd.toISOString(),
          amount: 12000,
          payment_method: 'mpesa',
          payment_reference: payment.reference,
          payment_status: 'paid',
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id);
      if (uErr) throw uErr;
    } else {
      const { error: iErr } = await supabase.from('subscriptions').insert({
        user_id: pending.user_id,
        plan: 'monthly',
        status: 'active',
        subscription_start: now.toISOString(),
        subscription_end: end.toISOString(),
        amount: 12000,
        payment_method: 'mpesa',
        payment_reference: payment.reference,
        payment_status: 'paid',
      });
      if (iErr) throw iErr;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('mpesa-webhook error', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
