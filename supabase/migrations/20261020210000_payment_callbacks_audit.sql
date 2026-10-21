-- Rekodi ya ukaguzi ya callback zinazoingia kutoka kwa watoa huduma (password imefichwa).
-- Service role pekee ndiyo huandika/husoma (RLS imewashwa bila policy).
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
