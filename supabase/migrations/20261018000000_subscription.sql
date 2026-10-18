-- KasiTrade: Subscription (trial siku 14 + PRO TZS 12,000/mwezi)
-- Inalenga production schema: subscriptions(user_id) + pending_payments
-- Idempotent: hufanya kazi hata kama tables tayari zipo
-- Endesha: supabase db push

create extension if not exists "pgcrypto";

-- =============================================================
-- 1. profiles.shop_id (baadhi ya schema hazina — ongeza bila kuharibu)
-- =============================================================
alter table public.profiles add column if not exists shop_id uuid;

-- =============================================================
-- 2. subscriptions: user_id-keyed (kama tayari haipo, tengeneza)
-- =============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  plan text not null default 'monthly',
  status text not null default 'trial',
  trial_start timestamptz,
  trial_end timestamptz,
  subscription_start timestamptz,
  subscription_end timestamptz,
  amount numeric,
  payment_method text,
  payment_reference text,
  payment_status text default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions (user_id);
create index if not exists idx_subscriptions_status on public.subscriptions (status);

alter table public.subscriptions enable row level security;

drop policy if exists "ks own subscription" on public.subscriptions;
create policy "ks own subscription"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id);

-- =============================================================
-- 3. pending_payments: malipo ya M-Pesa (kama tayari haipo, tengeneza)
-- =============================================================
create table if not exists public.pending_payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null,
  phone text,
  amount numeric,
  days integer default 30,
  status text default 'pending',
  provider text default 'mpesa',
  provider_receipt text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_pending_payments_user on public.pending_payments (user_id, created_at desc);

-- =============================================================
-- 4. ensure_subscription(): tayari ipo production (trial siku 14)
--    (returns single subscriptions row — usibadilishe return type)
-- =============================================================
grant execute on function public.ensure_subscription() to authenticated;
