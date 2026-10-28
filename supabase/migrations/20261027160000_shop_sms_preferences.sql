-- KasiTrade POS / SMS V2: opt-in sale-receipt SMS per shop (OFF by default).
-- A new table avoids altering existing checkout, orders, or SMS history.
CREATE TABLE IF NOT EXISTS public.shop_sms_preferences (
  shop_id UUID PRIMARY KEY REFERENCES public.shops(id) ON DELETE CASCADE,
  sale_receipts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shop_sms_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.shop_sms_preferences FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.shop_sms_preferences TO authenticated;

-- A user can read or edit only settings for a shop that they own.
CREATE POLICY shop_sms_preferences_owner_read ON public.shop_sms_preferences
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = shop_id AND s.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY shop_sms_preferences_owner_insert ON public.shop_sms_preferences
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = shop_id AND s.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY shop_sms_preferences_owner_update ON public.shop_sms_preferences
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = shop_id AND s.owner_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = shop_id AND s.owner_id = (SELECT auth.uid())
  ));
