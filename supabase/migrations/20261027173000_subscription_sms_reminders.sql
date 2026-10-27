
-- KasiTrade POS - subscription reminder records
-- Usiiendeshe kwenye Production bado.

CREATE TABLE IF NOT EXISTS public.subscription_sms_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  stage TEXT NOT NULL
    CHECK (stage IN ('7d', '3d', '1d', 'expired')),
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'accepted', 'unknown')),
  recipient TEXT NOT NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_end, stage)
);

CREATE INDEX IF NOT EXISTS subscription_sms_reminders_created_idx
  ON public.subscription_sms_reminders (created_at DESC);

ALTER TABLE public.subscription_sms_reminders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.subscription_sms_reminders
  FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.subscription_sms_reminders
  TO service_role;
