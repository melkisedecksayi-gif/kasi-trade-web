-- ============================================================
--  KasiTRADE - Subscription security
--  Endesha hii kwenye Supabase Dashboard -> SQL Editor
--  Inafunga tundu la kuweka status='active' moja kwa moja
--  kutoka browser, na kuweka activation kwa usalama (server-side).
-- ============================================================

-- 1) Washa RLS kwenye jedwali la subscriptions
alter table public.subscriptions enable row level security;

-- 2) Ondoa policies ZOTE zilizopo kwenye subscriptions (ziruhusu client
--    ku-insert/update status='active'). Tunafuta kwa mzunguko ili tusikose
--    jina lolote.
do $$
declare
  r record;
begin
  for r in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'subscriptions'
  loop
    execute format('drop policy if exists %I on public.subscriptions', r.policyname);
  end loop;
end $$;

-- 3) Mtumiaji anaweza KUSOMA subscription yake pekee (hakuna kuandika)
create policy "Users read own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 4) Jedwali la activation codes (admin anazalisha codes)
-- ============================================================
create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  days integer not null default 30,
  note text,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.activation_codes enable row level security;
-- Hakuna policy => hakuna mtu anayeweza kusoma/kuandika kwa API.
-- Admin anatumia Dashboard (service role) kuzalisha codes.

-- 5) ensure_subscription(): huunda trial ya siku 14 kama mtumiaji hana
create or replace function public.ensure_subscription()
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into sub from public.subscriptions where user_id = auth.uid();
  if not found then
    insert into public.subscriptions
      (user_id, plan, status, trial_start, trial_end, amount)
    values
      (auth.uid(), 'monthly', 'trial', now(), now() + interval '14 days', 12000)
    returning * into sub;
  end if;
  return sub;
end;
$$;

-- 6) get_my_subscription(): hurudisha usajili halisi, huunda trial kama
--    haipo, na huuweka 'expired' kwa saa ya database (server-side).
create or replace function public.get_my_subscription()
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into sub from public.subscriptions where user_id = auth.uid();

  if not found then
    insert into public.subscriptions
      (user_id, plan, status, trial_start, trial_end, amount)
    values
      (auth.uid(), 'monthly', 'trial', now(), now() + interval '14 days', 12000)
    returning * into sub;
  end if;

  -- Expiry server-side: end date ikipita au ikiwa haipo, funga (fail-closed)
  if sub.status = 'trial' and (sub.trial_end is null or now() > sub.trial_end) then
    update public.subscriptions
       set status = 'expired', updated_at = now()
     where id = sub.id
     returning * into sub;
  elsif sub.status = 'active' and (sub.subscription_end is null or now() > sub.subscription_end) then
    update public.subscriptions
       set status = 'expired', updated_at = now()
     where id = sub.id
     returning * into sub;
  end if;

  return sub;
end;
$$;

-- 6b) activate_subscription(code): huhakiki code kisha huwasha kwa muda
create or replace function public.activate_subscription(p_code text)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.activation_codes;
  sub public.subscriptions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_code
    from public.activation_codes
   where code = upper(trim(p_code))
     and used_by is null
   for update;

  if not found then
    raise exception 'Code si sahihi au imetumika';
  end if;

  update public.activation_codes
     set used_by = auth.uid(), used_at = now()
   where id = v_code.id;

  select * into sub from public.subscriptions where user_id = auth.uid();

  if not found then
    insert into public.subscriptions
      (user_id, plan, status, subscription_start, subscription_end, amount,
       payment_method, payment_reference, payment_status)
    values
      (auth.uid(), 'monthly', 'active', now(),
       now() + (v_code.days || ' days')::interval, 12000,
       'code', v_code.code, 'paid')
    returning * into sub;
  else
    update public.subscriptions
       set status = 'active',
           subscription_start = now(),
           subscription_end =
             greatest(coalesce(subscription_end, now()), now())
             + (v_code.days || ' days')::interval,
           amount = 12000,
           payment_method = 'code',
           payment_reference = v_code.code,
           payment_status = 'paid',
           updated_at = now()
     where id = sub.id
     returning * into sub;
  end if;

  return sub;
end;
$$;

grant execute on function public.ensure_subscription() to authenticated;
grant execute on function public.get_my_subscription() to authenticated;
grant execute on function public.activate_subscription(text) to authenticated;

-- ============================================================
-- 7) Mfano: kuzalisha activation codes (badilisha hapa chini)
--    Ukiwa na code 5: administrator pekee anaona hizi.
-- ============================================================
-- insert into public.activation_codes (code, days, note) values
--   ('KASI-2026-AAAA', 30, 'Mteja: duka la Kariakoo'),
--   ('KASI-2026-BBBB', 30, 'Mteja: mwingine');
