-- ============================================================
-- KasiTRADE Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- [1] SHOPS TABLE
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  business_type TEXT DEFAULT 'duka',
  phone TEXT,
  email TEXT,
  address TEXT,
  region TEXT,
  district TEXT,
  ward TEXT,
  tax_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'TZS',
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for shops: owner can do everything, everyone else can't see
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage own shop" ON shops
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);


-- [2] PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  barcode TEXT,
  buy_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'piece',
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage shop products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(shop_id, category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(shop_id, stock);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);


-- [3] CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  region TEXT,
  district TEXT,
  notes TEXT,
  total_purchases NUMERIC DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage shop customers" ON customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);


-- [4] TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage shop transactions" ON transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = transactions.shop_id AND shops.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = transactions.shop_id AND shops.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_transactions_shop ON transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(shop_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);


-- [5] TRANSACTION ITEMS TABLE
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  buy_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transaction items for their shop" ON transaction_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN shops s ON s.id = t.shop_id
      WHERE t.id = transaction_items.transaction_id AND s.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_transitems_txn ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transitems_product ON transaction_items(product_id);


-- [6] EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'other',
  expense_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage shop expenses" ON expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = expenses.shop_id AND shops.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = expenses.shop_id AND shops.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_expenses_shop ON expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(shop_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(shop_id, category);


-- [7] SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  products_supplied TEXT,
  payment_terms TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage shop suppliers" ON suppliers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = suppliers.shop_id AND shops.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = suppliers.shop_id AND shops.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_suppliers_shop ON suppliers(shop_id);


-- [8] PROFILES TABLE (Synced with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  business_type TEXT,
  business_name TEXT,
  country TEXT DEFAULT 'Tanzania',
  region TEXT,
  district TEXT,
  ward TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "User can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "User can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- [9] STOCK MOVEMENTS TABLE (Audit trail)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  movement_type TEXT NOT NULL DEFAULT 'adjustment',
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view stock movements for their shop" ON stock_movements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = stock_movements.shop_id AND shops.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = stock_movements.shop_id AND shops.owner_id = auth.uid())
  );


-- [10] SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  amount NUMERIC DEFAULT 12000,
  payment_method TEXT,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);


-- [11] AUTO-CREATE PROFILE & TRIAL ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_duration INTERVAL := INTERVAL '14 days';
BEGIN
  INSERT INTO profiles (id, email, phone, business_type, business_name, country, region, district, ward)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'business_type',
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'region',
    NEW.raw_user_meta_data->>'district',
    NEW.raw_user_meta_data->>'ward'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  INSERT INTO subscriptions (user_id, plan, status, trial_start, trial_end, amount)
  VALUES (
    NEW.id,
    'monthly',
    'trial',
    NOW(),
    NOW() + trial_duration,
    12000
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- [12] UPDATED_AT TRIGGER (Auto-update timestamp)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('shops', 'products', 'customers', 'expenses', 'suppliers', 'profiles', 'subscriptions')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
      CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t, t, t, t);
  END LOOP;
END;
$$;


-- [13] SMS SETTINGS (per shop)
CREATE TABLE IF NOT EXISTS sms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE UNIQUE,
  provider TEXT DEFAULT 'meseji',
  api_key TEXT DEFAULT '',
  secret_key TEXT DEFAULT '',
  username TEXT DEFAULT '',
  sender_id TEXT DEFAULT 'KasiTRADE',
  is_enabled BOOLEAN DEFAULT false,
  auto_close_enabled BOOLEAN DEFAULT false,
  auto_close_time TIME DEFAULT '22:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shop sms_settings"
  ON sms_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = sms_settings.shop_id AND shops.owner_id = auth.uid()));


-- [14] SMS LOGS (outgoing messages)
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'report',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  provider_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_shop_id ON sms_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shop sms_logs"
  ON sms_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = sms_logs.shop_id AND shops.owner_id = auth.uid()));


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sms_settings'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sms_settings_updated_at ON sms_settings;
    CREATE TRIGGER trg_sms_settings_updated_at BEFORE UPDATE ON sms_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sms_logs_updated_at') THEN
    EXECUTE 'CREATE TRIGGER trg_sms_logs_created_at_set DEFAULT NOW() ON sms_logs BEFORE INSERT FOR EACH ROW EXECUTE FUNCTION update_updated_at();';
  END IF;
END;
$$;


-- [15] STORAGE: AVATARS BUCKET

-- Create avatars bucket (public for image URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload avatars to their own folder
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars (needed for getPublicUrl)
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
