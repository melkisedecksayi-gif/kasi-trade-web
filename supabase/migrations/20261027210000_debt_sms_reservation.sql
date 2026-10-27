
-- KasiTrade: secure debt SMS reservation
-- Local development only. Do not deploy yet.

CREATE OR REPLACE FUNCTION public.reserve_debt_sms_reminder(
  p_customer_id UUID,
  p_due_date DATE,
  p_stage TEXT,
  p_recipient TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c RECORD;
  v_phone TEXT;
  v_days INTEGER;
  v_stage TEXT;
  v_count INTEGER;
  v_rows INTEGER;
  v_today DATE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  -- One global lock protects daily budget across workers.
  PERFORM pg_advisory_xact_lock(21127, 4301);

  SELECT id, shop_id, phone, balance,
         debt_due_date, debt_sms_enabled
    INTO c
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND OR c.debt_sms_enabled IS DISTINCT FROM TRUE
     OR c.balance IS NULL OR c.balance <= 0
     OR c.debt_due_date IS NULL
     OR c.debt_due_date IS DISTINCT FROM p_due_date
  THEN
    RETURN 'not_eligible';
  END IF;

  v_phone := regexp_replace(
    coalesce(c.phone, ''), '[^0-9]', '', 'g'
  );

  IF v_phone ~ '^0[67][0-9]{8}$' THEN
    v_phone := '255' || substring(v_phone FROM 2);
  END IF;

  IF v_phone !~ '^255[67][0-9]{8}$'
     OR v_phone IS DISTINCT FROM p_recipient
  THEN
    RETURN 'not_eligible';
  END IF;

  v_today := (now() AT TIME ZONE 'Africa/Dar_es_Salaam')::DATE;
  v_days := c.debt_due_date - v_today;

  v_stage := CASE v_days
    WHEN 3 THEN '3d'
    WHEN 1 THEN '1d'
    WHEN 0 THEN 'due'
    WHEN -1 THEN 'overdue'
    ELSE NULL
  END;

  IF v_stage IS NULL OR v_stage IS DISTINCT FROM p_stage THEN
    RETURN 'not_eligible';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.customer_debt_sms_reminders
    WHERE customer_id = p_customer_id
      AND due_date = p_due_date
      AND stage = p_stage
  ) THEN
    RETURN 'duplicate';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.customer_debt_sms_reminders
  WHERE created_at >= v_today::TIMESTAMP
        AT TIME ZONE 'Africa/Dar_es_Salaam'
    AND created_at <
        (v_today + 1)::TIMESTAMP
        AT TIME ZONE 'Africa/Dar_es_Salaam';

  IF v_count >= 25 THEN
    RETURN 'daily_limit';
  END IF;

  INSERT INTO public.customer_debt_sms_reminders (
    customer_id, shop_id, due_date, stage,
    amount_snapshot, recipient, status
  )
  VALUES (
    c.id, c.shop_id, c.debt_due_date, p_stage,
    c.balance, v_phone, 'reserved'
  )
  ON CONFLICT (customer_id, due_date, stage) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN 'duplicate';
  END IF;

  RETURN 'reserved';
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_debt_sms_reminder(
  UUID, DATE, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_debt_sms_reminder(
  UUID, DATE, TEXT, TEXT
) TO service_role;
