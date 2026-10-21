-- Kikomo cha kasi (rate limit) cha Edge Function `send-sms`: kinazuia mtu kutumia function
-- hiyo kutuma SMS nyingi (SMS pumping). Service role pekee ndiyo huandika/husoma
-- (RLS imewashwa bila policy).
create table if not exists public.sms_send_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null,          -- otp | welcome | password_reset | custom
  phone text not null,         -- 255XXXXXXXXX
  ip text,
  user_id uuid
);

alter table public.sms_send_attempts enable row level security;
revoke all on public.sms_send_attempts from anon, authenticated;

create index if not exists sms_send_attempts_phone_idx on public.sms_send_attempts (phone, created_at desc);
create index if not exists sms_send_attempts_ip_idx on public.sms_send_attempts (ip, created_at desc);
create index if not exists sms_send_attempts_user_idx on public.sms_send_attempts (user_id, created_at desc);
