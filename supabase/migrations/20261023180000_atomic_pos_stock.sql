-- KasiTRADE: atomic checkout / inventory history / safe manual stock edits.
-- Apply via Supabase migrations (or SQL Editor) BEFORE deploying the updated React app.
-- Existing sales cannot be backfilled into transaction_items without source details.

-- v2 FIX: creates stock_movements on databases where that table was not installed.
-- Entire migration is atomic: a SQL error rolls back all changes.
BEGIN;
-- Columns required for POS and Sales Reports
ALTER TABLE public.transaction_items
    ADD COLUMN IF NOT EXISTS product_name TEXT,
    ADD COLUMN IF NOT EXISTS buy_price NUMERIC DEFAULT 0;


create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  quantity_change integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  movement_type text not null default 'adjustment',
  reference_id uuid,
  notes text,
  created_at timestamptz default now()
);

create index if not exists stock_movements_shop_date_idx
  on public.stock_movements(shop_id, created_at desc);
create index if not exists stock_movements_product_date_idx
  on public.stock_movements(product_id, created_at desc);

alter table public.stock_movements enable row level security;

drop policy if exists stock_movements_select_owned_shop on public.stock_movements;
create policy stock_movements_select_owned_shop on public.stock_movements
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = stock_movements.shop_id and s.owner_id = (select auth.uid())
  ));

-- No direct client writes; protected SECURITY DEFINER RPC/trigger writes movements.
revoke all on public.stock_movements from public, anon, authenticated;
grant select on public.stock_movements to authenticated;

alter table public.transactions
  add column if not exists checkout_request_id uuid;
create unique index if not exists transactions_checkout_request_id_unique
  on public.transactions(checkout_request_id)
  where checkout_request_id is not null;

-- Each new product with opening stock is recorded (including CSV imports).
create or replace function public.log_initial_product_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stock is not null and new.stock > 0 then
    insert into public.stock_movements
      (product_id, shop_id, quantity_change, previous_stock, new_stock, movement_type, notes)
    values
      (new.id, new.shop_id, new.stock, 0, new.stock, 'initial', 'Opening stock');
  end if;
  return new;
end;
$$;
revoke all on function public.log_initial_product_stock() from public, anon, authenticated;
drop trigger if exists trg_log_initial_product_stock on public.products;
create trigger trg_log_initial_product_stock
  after insert on public.products
  for each row execute function public.log_initial_product_stock();

-- One transaction means: sale header, item rows, decremented inventory and audit history.
-- SECURITY DEFINER bypasses RLS; authentication + shop ownership are checked explicitly.
create or replace function public.checkout_sale(
  p_shop_id uuid,
  p_request_id uuid,
  p_items jsonb,
  p_discount numeric,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_quantity integer;
  v_expected_price numeric;
  v_subtotal numeric := 0;
  v_cost numeric := 0;
  v_item_count integer := 0;
  v_discount numeric;
  v_sale public.transactions%rowtype;
  v_lines jsonb := '[]'::jsonb;
  v_receipt_items jsonb;
  v_line jsonb;
begin
  if auth.uid() is null then
    raise exception 'Please sign in before checkout' using errcode = '42501';
  end if;
  if p_shop_id is null or not exists (
    select 1 from public.shops s
    where s.id = p_shop_id and s.owner_id = auth.uid() and coalesce(s.is_active, true)
  ) then
    raise exception 'Shop not found or access denied' using errcode = '42501';
  end if;
  if p_request_id is null then
    raise exception 'Checkout request ID is required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception 'Cart must contain between 1 and 100 products' using errcode = '22023';
  end if;
  if p_payment_method is null or p_payment_method not in ('cash', 'mobile', 'card') then
    raise exception 'Invalid payment method' using errcode = '22023';
  end if;
  v_discount := coalesce(p_discount, 0);
  if v_discount < 0 or v_discount <> round(v_discount, 2) then
    raise exception 'Invalid discount amount' using errcode = '22023';
  end if;

  -- Serializes retries with the same request id. Retrying after a dropped network
  -- response returns the ORIGINAL sale instead of subtracting stock twice.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_id::text, 0));
  select * into v_sale from public.transactions
    where checkout_request_id = p_request_id;
  if found then
    if v_sale.shop_id <> p_shop_id then
      raise exception 'Checkout request ID already used' using errcode = '23505';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.product_id, 'name', i.product_name, 'quantity', i.quantity,
        'sell_price', i.unit_price, 'buy_price', i.buy_price)
        order by i.created_at, i.id), '[]'::jsonb)
      into v_receipt_items
      from public.transaction_items i where i.transaction_id = v_sale.id;
    return jsonb_build_object(
      'transaction_id', v_sale.id, 'created_at', v_sale.created_at,
      'total', v_sale.total_amount,
      'discount', v_sale.discount,
      'subtotal', v_sale.total_amount + coalesce(v_sale.discount, 0),
      'items_count', v_sale.items_count,
      'items', v_receipt_items,
      'already_processed', true);
  end if;

  -- Stable lock order prevents checkout/checkouts from deadlocking each other.
  for v_row in
    select x.value from jsonb_array_elements(p_items) x(value)
      order by x.value->>'product_id'
  loop
    if jsonb_typeof(v_row) <> 'object' or
       not (v_row ? 'product_id' and v_row ? 'quantity' and v_row ? 'expected_unit_price') then
      raise exception 'Invalid cart item' using errcode = '22023';
    end if;
    v_product_id := (v_row->>'product_id')::uuid;
    v_quantity := (v_row->>'quantity')::integer;
    v_expected_price := (v_row->>'expected_unit_price')::numeric;
    if v_quantity <= 0 or v_quantity > 1000000 or v_expected_price < 0 then
      raise exception 'Invalid product quantity or price' using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements(v_lines) e(value)
               where (e.value->>'product_id')::uuid = v_product_id) then
      raise exception 'Duplicate products in cart' using errcode = '22023';
    end if;

    select * into v_product from public.products
      where id = v_product_id and shop_id = p_shop_id and coalesce(is_active, true)
      for update;
    if not found then
      raise exception 'Product not found or unavailable. Refresh products.' using errcode = 'P0001';
    end if;
    if v_expected_price is distinct from v_product.sell_price then
      raise exception 'Product price changed. Refresh the cart.' using errcode = 'P0001';
    end if;
    if coalesce(v_product.stock, 0) < v_quantity then
      raise exception 'Insufficient stock for %. Available: %',
        v_product.name, coalesce(v_product.stock, 0) using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + v_product.sell_price * v_quantity;
    v_cost := v_cost + coalesce(v_product.buy_price, 0) * v_quantity;
    v_item_count := v_item_count + v_quantity;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id, 'name', v_product.name,
      'quantity', v_quantity, 'sell_price', v_product.sell_price,
      'buy_price', coalesce(v_product.buy_price, 0),
      'previous_stock', v_product.stock,
      'new_stock', v_product.stock - v_quantity));
  end loop;

  if v_discount > v_subtotal then
    raise exception 'Discount cannot exceed the subtotal' using errcode = '22023';
  end if;

  insert into public.transactions
    (shop_id, checkout_request_id, total_amount, profit, discount, payment_method, items_count)
  values
    (p_shop_id, p_request_id, v_subtotal - v_discount,
     v_subtotal - v_discount - v_cost, v_discount, p_payment_method, v_item_count)
  returning * into v_sale;

  for v_line in select value from jsonb_array_elements(v_lines) loop
    v_product_id := (v_line->>'product_id')::uuid;
    v_quantity := (v_line->>'quantity')::integer;
    insert into public.transaction_items
      (transaction_id, product_id, product_name, quantity, unit_price, buy_price, total_price)
    values
      (v_sale.id, v_product_id, v_line->>'name', v_quantity,
       (v_line->>'sell_price')::numeric, (v_line->>'buy_price')::numeric,
       (v_line->>'sell_price')::numeric * v_quantity);

    update public.products set stock = (v_line->>'new_stock')::integer,
      updated_at = now()
      where id = v_product_id and shop_id = p_shop_id;

    insert into public.stock_movements
      (product_id, shop_id, quantity_change, previous_stock, new_stock,
       movement_type, reference_id, notes)
    values
      (v_product_id, p_shop_id, -v_quantity,
       (v_line->>'previous_stock')::integer, (v_line->>'new_stock')::integer,
       'sale', v_sale.id, 'POS checkout');
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', l.value->>'product_id', 'name', l.value->>'name',
      'quantity', (l.value->>'quantity')::int,
      'sell_price', (l.value->>'sell_price')::numeric,
      'buy_price', (l.value->>'buy_price')::numeric)), '[]'::jsonb)
    into v_receipt_items from jsonb_array_elements(v_lines) l(value);

  return jsonb_build_object(
    'transaction_id', v_sale.id, 'created_at', v_sale.created_at, 'total', v_sale.total_amount,
    'discount', v_sale.discount, 'subtotal', v_subtotal,
    'items_count', v_item_count, 'items', v_receipt_items,
    'already_processed', false);
end;
$$;
revoke all on function public.checkout_sale(uuid, uuid, jsonb, numeric, text) from public, anon;
grant execute on function public.checkout_sale(uuid, uuid, jsonb, numeric, text) to authenticated;

-- Product editor: update details + stock and its movement in the same DB transaction.
-- Detect a stale stock value, so an older browser tab cannot overwrite a recent sale.
create or replace function public.update_product_with_stock(
  p_shop_id uuid,
  p_product_id uuid,
  p_expected_stock integer,
  p_new_stock integer,
  p_name text,
  p_category text,
  p_buy_price numeric,
  p_sell_price numeric
)
returns public.products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_previous integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.shops s where s.id = p_shop_id and s.owner_id = auth.uid()
  ) then
    raise exception 'Shop not found or access denied' using errcode = '42501';
  end if;
  if p_new_stock is null or p_new_stock < 0 or
     p_name is null or length(btrim(p_name)) = 0 or
     p_buy_price is null or p_buy_price < 0 or
     p_sell_price is null or p_sell_price < 0 then
    raise exception 'Invalid product details or stock' using errcode = '22023';
  end if;
  select * into v_product from public.products
    where id = p_product_id and shop_id = p_shop_id for update;
  if not found then
    raise exception 'Product not found' using errcode = 'P0001';
  end if;
  v_previous := v_product.stock;
  if v_previous is distinct from p_expected_stock then
    raise exception 'Stock changed since you opened this product. Close and reopen the product before saving.'
      using errcode = 'P0001';
  end if;
  update public.products set
    name = btrim(p_name), category = p_category, buy_price = p_buy_price,
    sell_price = p_sell_price, stock = p_new_stock, updated_at = now()
    where id = p_product_id and shop_id = p_shop_id
    returning * into v_product;
  if p_new_stock is distinct from v_previous then
    insert into public.stock_movements
      (product_id, shop_id, quantity_change, previous_stock, new_stock, movement_type, notes)
    values
      (p_product_id, p_shop_id, p_new_stock - coalesce(v_previous, 0),
       coalesce(v_previous, 0), p_new_stock, 'adjustment', 'Manual stock edit');
  end if;
  return v_product;
end;
$$;
revoke all on function public.update_product_with_stock(uuid, uuid, integer, integer, text, text, numeric, numeric) from public, anon;
grant execute on function public.update_product_with_stock(uuid, uuid, integer, integer, text, text, numeric, numeric) to authenticated;

-- Existing sales are still readable, but all NEW sales must use the atomic RPC.
-- Prevent clients from writing a transaction header without line items or audit entries.
revoke insert, update, delete on public.transactions, public.transaction_items,
  public.stock_movements from public, anon, authenticated;
grant select on public.transactions, public.transaction_items,
  public.stock_movements to authenticated;

-- Inventory quantity is only changed by checkout_sale / update_product_with_stock,
-- not through a direct update using stale values from an open browser tab.
revoke update on public.products from public, anon, authenticated;
grant update (name, category, barcode, buy_price, sell_price, min_stock,
  unit, image_url, description, is_active, updated_at)
  on public.products to authenticated;

-- Existing negative stock is not rewritten during migration. Future writes must
-- be nonnegative, and existing bad rows can be inspected/corrected separately.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
                 where conrelid = 'public.products'::regclass
                   and conname = 'products_stock_nonnegative') then
    alter table public.products add constraint products_stock_nonnegative
      check (stock >= 0) not valid;
  end if;
end $$;

notify pgrst, 'reload schema';

COMMIT;
