-- ============================================================
--  KasiTRADE - Payments (AzamPay)
--  Endesha baada ya subscription_security.sql
-- ============================================================

-- Malipo yanayosubiri (pending) - yanaunganisha mtumiaji na reference
create table if not exists public.pending_payments (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  user_id uuid not null,
  phone text,
  amount integer not null default 12000,
  days integer not null default 30,
  status text not null default 'pending',   -- pending | completed | failed
  provider text,
  provider_receipt text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Sababu ya malipo kufeli (inaonyeshwa kwa mtumiaji)
alter table public.pending_payments add column if not exists failure_reason text;
alter table public.pending_payments add column if not exists provider_response jsonb;
-- AzamPay externalId (ya kipekee kwa kila muamala)
alter table public.pending_payments add column if not exists external_id text;
-- Mtandao wa wallet: Mpesa | Airtel | Tigo | Halopesa | Azampesa
alter table public.pending_payments add column if not exists network text;
alter table public.pending_payments drop constraint if exists pending_payments_network_check;
alter table public.pending_payments add constraint pending_payments_network_check
  check (network is null or network in ('Mpesa', 'Airtel', 'Tigo', 'Halopesa', 'Azampesa'));
create unique index if not exists pending_payments_external_id_uidx
  on public.pending_payments (external_id) where external_id is not null;

-- Hamisha data ya zamani: 'paid' (webhook ya zamani) sasa ni 'completed'
update public.pending_payments set status = 'completed' where status = 'paid';

-- Kikwazo cha status (idempotent)
alter table public.pending_payments
  drop constraint if exists pending_payments_status_check;
alter table public.pending_payments
  add constraint pending_payments_status_check
  check (status in ('pending', 'completed', 'failed'));

-- Risiti moja ya mtandao haiwezi kuwasha zaidi ya malipo moja (inazuia replay)
create unique index if not exists pending_payments_completed_receipt_uidx
  on public.pending_payments (provider_receipt)
  where status = 'completed' and provider_receipt is not null;

create index if not exists pending_payments_user_status_idx
  on public.pending_payments (user_id, status, created_at desc);

alter table public.pending_payments enable row level security;

-- Mtumiaji anaweza KUSOMA malipo yake pekee.
-- HAWEZI kuunda/kubadili: Edge Functions (service role) pekee ndizo huandika.
drop policy if exists "users read own pending payments" on public.pending_payments;
create policy "users read own pending payments"
  on public.pending_payments for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own pending payments" on public.pending_payments;

revoke insert, update, delete on public.pending_payments from anon, authenticated;

-- ============================================================
--  complete_payment(): NJIA MOJA ya kuwasha subscription kutokana na malipo.
--  Ni atomic na idempotent: malipo yale yale hayawezi kuongeza siku mara mbili,
--  hata callback/poll/webhook zikikimbia pamoja.
--  Inarudisha true kama imewasha sasa hivi, false kama tayari ilikuwa imewashwa.
-- ============================================================
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
  -- Funga na ubadilishe status mara moja; mshindani wa pili hapati row.
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
         -- Ongeza juu ya muda uliobaki (usajili au trial), usipoteze siku
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

-- ============================================================
--  Rekodi ya ukaguzi ya callback za AzamPay (password imefichwa).
--  Service role pekee ndiyo huandika/husoma (RLS imewashwa bila policy).
-- ============================================================
create table if not exists public.payment_callbacks (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  provider text not null,
  body jsonb,
  outcome text
);

alter table public.payment_callbacks enable row level security;
revoke all on public.payment_callbacks from anon, authenticated;

create index if not exists payment_callbacks_received_idx
  on public.payment_callbacks (received_at desc);

-- ============================================================
--  Safu nyeti (external_id, provider_response, provider_receipt, reference) hazisomeki
--  na mtumiaji — service role pekee. Angalia migrations/20261021110000_*.sql
-- ============================================================
revoke select on public.pending_payments from anon, authenticated;
grant select (id, user_id, phone, amount, days, status, provider, network,
              created_at, paid_at, failure_reason)
  on public.pending_payments to authenticated;
