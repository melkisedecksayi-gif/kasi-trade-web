-- ============================================================
--  KasiTRADE - Malipo kupitia AzamPay PEKEE (M-Pesa/Vodacom ya moja kwa moja imeondolewa)
-- ============================================================

-- Mtandao wa wallet aliouchagua mteja: Mpesa | Airtel | Tigo | Halopesa | Azampesa
alter table public.pending_payments add column if not exists network text;

alter table public.pending_payments
  drop constraint if exists pending_payments_network_check;
alter table public.pending_payments
  add constraint pending_payments_network_check
  check (network is null or network in ('Mpesa', 'Airtel', 'Tigo', 'Halopesa', 'Azampesa'));

-- Malipo ya zamani yaliyoanzishwa kupitia azampay-push yalihifadhiwa na provider='Mpesa'
-- (yaani mtandao). Yahamishie kwenye muundo mpya: provider='azampay', network='Mpesa'.
-- Malipo ya zamani ya Vodacom ya moja kwa moja hayana external_id, kwa hiyo hayaguswi.
update public.pending_payments
   set network = provider,
       provider = 'azampay'
 where provider = 'Mpesa'
   and external_id is not null
   and network is null;

-- complete_payment(): payment_method sasa ni 'azampay-<mtandao>' (mf. azampay-mpesa)
create or replace function public.complete_payment(
  p_payment_id uuid,
  p_receipt text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.pending_payments%rowtype;
  v_method text;
begin
  update public.pending_payments
     set status = 'completed',
         paid_at = now(),
         provider_receipt = coalesce(nullif(p_receipt, ''), provider_receipt)
   where id = p_payment_id
     and status in ('pending', 'failed')
  returning * into v_pay;

  if not found then
    return false;
  end if;

  v_method := coalesce(v_pay.provider, 'azampay')
              || case when v_pay.network is not null then '-' || lower(v_pay.network) else '' end;

  insert into public.subscriptions
    (user_id, plan, status, subscription_start, subscription_end, amount,
     payment_method, payment_reference, payment_status, updated_at)
  values
    (v_pay.user_id, 'monthly', 'active', now(),
     now() + make_interval(days => v_pay.days), v_pay.amount,
     v_method,
     coalesce(v_pay.provider_receipt, v_pay.reference), 'paid', now())
  on conflict (user_id) do update
     set status = 'active',
         plan = coalesce(public.subscriptions.plan, 'monthly'),
         subscription_start = now(),
         subscription_end =
           greatest(
             now(),
             coalesce(public.subscriptions.subscription_end, now()),
             coalesce(public.subscriptions.trial_end, now())
           ) + make_interval(days => v_pay.days),
         amount = v_pay.amount,
         payment_method = v_method,
         payment_reference = coalesce(v_pay.provider_receipt, v_pay.reference),
         payment_status = 'paid',
         updated_at = now();

  return true;
end;
$$;

revoke all on function public.complete_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_payment(uuid, text) to service_role;

-- service_activate() ilikuwa ya njia ya zamani ya M-Pesa (bei na 'mpesa' zimeandikwa ndani).
-- Hakuna code inayoitumia tena.
drop function if exists public.service_activate(uuid, integer, text);
