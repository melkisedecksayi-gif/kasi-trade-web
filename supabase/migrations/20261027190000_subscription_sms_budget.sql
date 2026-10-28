
-- Subscription SMS: atomic reservation na kikomo cha siku.
-- Hifadhi kwenye project; usiendeshe Production bado.

CREATE OR REPLACE FUNCTION public.reserve_subscription_sms_reminder(
  p_user_id UUID,
  p_period_end TIMESTAMPTZ,
  p_stage TEXT,
  p_recipient TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today TIMESTAMPTZ;
  v_count INTEGER;
  v_inserted INTEGER;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL
     OR p_period_end IS NULL
     OR p_stage IS NULL
     OR p_stage NOT IN ('7d', '3d', '1d', 'expired')
     OR p_recipient IS NULL
     OR p_recipient !~ '^255[67][0-9]{8}$'
  THEN
    RAISE EXCEPTION 'Invalid reminder parameters';
  END IF;

  -- Hufunga reservation wakati worker mwingine anakagua bajeti.
  PERFORM pg_advisory_xact_lock(21127, 4300);

  IF EXISTS (
    SELECT 1
    FROM public.subscription_sms_reminders
    WHERE user_id = p_user_id
      AND period_end = p_period_end
      AND stage = p_stage
  ) THEN
    RETURN 'duplicate';
  END IF;

  v_today := date_trunc(
    'day',
    now() AT TIME ZONE 'Africa/Dar_es_Salaam'
  ) AT TIME ZONE 'Africa/Dar_es_Salaam';

  SELECT COUNT(*) INTO v_count
  FROM public.subscription_sms_reminders
  WHERE created_at >= v_today
    AND created_at < v_today + INTERVAL '1 day';

  IF v_count >= 25 THEN
    RETURN 'daily_limit';
  END IF;

  INSERT INTO public.subscription_sms_reminders (
    user_id, period_end, stage, recipient, status
  )
  VALUES (
    p_user_id, p_period_end, p_stage, p_recipient, 'reserved'
  )
  ON CONFLICT (user_id, period_end, stage) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN 'duplicate';
  END IF;

  RETURN 'reserved';
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_subscription_sms_reminder(
  UUID, TIMESTAMPTZ, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_subscription_sms_reminder(
  UUID, TIMESTAMPTZ, TEXT, TEXT
) TO service_role;
