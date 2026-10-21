-- ============================================================
--  KasiTRADE - Core RLS: shops, profiles, products
--
--  Tatizo lililoonekana kwenye database ya remote:
--   * profiles: policy "Users can view own profile" ilikuwa USING (true)
--     => mtu yeyote (hata anon) anaweza kusoma profiles ZOTE (email, simu),
--        na `.select('*').single()` ilirudisha rows nyingi => HTTP 406.
--   * shops/profiles/products: policies zilikuwa kwa role {public} (inajumuisha anon)
--     badala ya `authenticated` tu; anon ana ALL privileges kwenye tables hizi.
--   * Policies hizi hazikuwa kwenye supabase/migrations (zilikuwa kwenye
--     database/schema.sql tu), kwa hiyo `supabase db push` haikuzirekebisha.
--
--  Migration hii ni idempotent: inafuta policies zote za zamani za tables
--  hizi 3 (zikiwemo zisizo kwenye repo) kisha inaziunda upya kwa usahihi.
-- ============================================================

-- 1. Futa policies zote zilizopo (majina yoyote) kwenye shops/profiles/products
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in ('shops', 'profiles', 'products')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.shops    enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;

-- 2. Privileges: anon hana nafasi kabisa; authenticated ana CRUD (RLS ndiyo inazuia)
revoke all on public.shops, public.profiles, public.products from anon;
grant select, insert, update, delete on public.shops, public.profiles, public.products to authenticated;

-- ------------------------------------------------------------
-- 3. SHOPS: mmiliki pekee
-- ------------------------------------------------------------
create policy "shops_select_own" on public.shops
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "shops_insert_own" on public.shops
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "shops_update_own" on public.shops
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "shops_delete_own" on public.shops
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ------------------------------------------------------------
-- 4. PROFILES: profile yake mwenyewe tu
-- ------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ------------------------------------------------------------
-- 5. PRODUCTS: bidhaa za maduka ya mtumiaji tu
-- ------------------------------------------------------------
create policy "products_select_own_shop" on public.products
  for select to authenticated
  using (exists (select 1 from public.shops s
                  where s.id = products.shop_id and s.owner_id = (select auth.uid())));

create policy "products_insert_own_shop" on public.products
  for insert to authenticated
  with check (exists (select 1 from public.shops s
                       where s.id = products.shop_id and s.owner_id = (select auth.uid())));

create policy "products_update_own_shop" on public.products
  for update to authenticated
  using (exists (select 1 from public.shops s
                  where s.id = products.shop_id and s.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.shops s
                       where s.id = products.shop_id and s.owner_id = (select auth.uid())));

create policy "products_delete_own_shop" on public.products
  for delete to authenticated
  using (exists (select 1 from public.shops s
                  where s.id = products.shop_id and s.owner_id = (select auth.uid())));

create index if not exists idx_shops_owner on public.shops (owner_id);
create index if not exists idx_products_shop on public.products (shop_id);

-- 6. Backfill: watumiaji wasio na profile (trigger handle_new_user haikuwahi kuwaundia)
insert into public.profiles (id, email)
select u.id, u.email
  from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
