-- ============================================================
--  KasiTRADE - Payments (M-Pesa / Lipa Namba)
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
  status text not null default 'pending',   -- pending | paid | failed
  provider text,
  provider_receipt text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.pending_payments enable row level security;

-- Mtumiaji anaweza kusoma na kuunda malipo yake mwenyewe pekee
drop policy if exists "users read own pending payments" on public.pending_payments;
create policy "users read own pending payments"
  on public.pending_payments for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own pending payments" on public.pending_payments;
create policy "users insert own pending payments"
  on public.pending_payments for insert to authenticated
  with check (auth.uid() = user_id);

-- Admin/agent (service role) pekee anaweza ku-update

-- ============================================================
--  service_activate(): inaitwa na Edge Function (service role)
--  Huthibitisha malipo na kuwasha subscription kwa siku zilizoainishwa
-- ============================================================
create or replace function public.service_activate(
  p_user_id uuid,
  p_days integer,
  p_reference text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscriptions
     set status = 'active',
         subscription_start = now(),
         subscription_end =
           greatest(coalesce(subscription_end, now()), now())
           + (p_days || ' days')::interval,
         amount = 12000,
         payment_method = 'mpesa',
         payment_reference = p_reference,
         payment_status = 'paid',
         updated_at = now()
   where user_id = p_user_id;

  if not found then
    insert into public.subscriptions
      (user_id, plan, status, subscription_start, subscription_end, amount,
       payment_method, payment_reference, payment_status)
    values
      (p_user_id, 'monthly', 'active', now(),
       now() + (p_days || ' days')::interval, 12000,
       'mpesa', p_reference, 'paid');
  end if;
end;
$$;

-- Hii function inaitwa na service role pekee
revoke all on function public.service_activate(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.service_activate(uuid, integer, text) to service_role;
