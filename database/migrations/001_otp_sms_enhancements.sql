-- ============================================================
-- KasiTRADE Migration: OTP & Enhanced SMS (v2)
-- Run this on your EXISTING Supabase production database
-- Paste into Supabase SQL Editor and execute
-- ============================================================

-- [1] Add login_otp_enabled to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_otp_enabled BOOLEAN DEFAULT false;

-- [2] Add missing columns to sms_settings
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS customer_sms_enabled BOOLEAN DEFAULT false;
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS low_stock_enabled BOOLEAN DEFAULT false;
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 10;

-- [3] Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login',
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_user_purpose ON otp_codes(user_id, purpose, used);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'otp_codes' AND policyname = 'Users can view own OTP codes'
  ) THEN
    CREATE POLICY "Users can view own OTP codes" ON otp_codes
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END;
$$;

-- [4] Generate OTP function
CREATE OR REPLACE FUNCTION generate_otp(
  p_user_id UUID,
  p_purpose TEXT DEFAULT 'login',
  p_expiry_minutes INT DEFAULT 5
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  UPDATE otp_codes SET used = true
  WHERE user_id = p_user_id AND purpose = p_purpose AND used = false;

  INSERT INTO otp_codes (user_id, code, purpose, expires_at)
  VALUES (p_user_id, v_code, p_purpose, NOW() + (p_expiry_minutes || ' minutes')::INTERVAL);

  RETURN v_code;
END;
$$;

-- [5] Verify OTP function
CREATE OR REPLACE FUNCTION verify_otp(
  p_user_id UUID,
  p_code TEXT,
  p_purpose TEXT DEFAULT 'login'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM otp_codes
  WHERE user_id = p_user_id
    AND code = p_code
    AND purpose = p_purpose
    AND used = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE otp_codes SET used = true WHERE id = v_id;
  RETURN true;
END;
$$;

-- [6] Clean up expired OTP codes (optional - prevents table bloat)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$;
