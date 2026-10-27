
-- KasiTrade POS: debt SMS foundation.
-- Usitumie migration hii kwenye Production bado.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS debt_due_date DATE,
  ADD COLUMN IF NOT EXISTS debt_sms_enabled BOOLEAN
    NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.customer_debt_sms_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL
    REFERENCES public.customers(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL
    REFERENCES public.shops(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  stage TEXT NOT NULL
    CHECK (stage IN ('3d', '1d', 'due', 'overdue')),
  amount_snapshot NUMERIC NOT NULL
    CHECK (amount_snapshot > 0),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'accepted', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, due_date, stage)
);

CREATE INDEX IF NOT EXISTS debt_sms_due_idx
  ON public.customers (shop_id, debt_due_date)
  WHERE debt_sms_enabled = TRUE AND balance > 0;

ALTER TABLE public.customer_debt_sms_reminders
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.customer_debt_sms_reminders
  FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE
  ON public.customer_debt_sms_reminders TO service_role;
