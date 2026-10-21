-- ============================================================
--  Zuia mtumiaji kusoma safu nyeti za pending_payments.
--
--  `external_id` (utilityref ya AzamPay) ndiyo inayotambulisha malipo kwenye callback;
--  `provider_response` na `provider_receipt` zina data ya AzamPay; `reference` ni ya ndani.
--  Mtumiaji akizisoma, anaweza kughushi callback ya "success" (hasa pale
--  AZAMPAY_CALLBACK_PASSWORD haijawekwa). Edge Functions hutumia service role,
--  kwa hiyo haziathiriwi.
--
--  Sasa: authenticated anaweza kusoma safu salama tu (RLS bado inamzuia kuona malipo ya wengine).
--  `select *` kutoka client itashindwa kwa makusudi — taja safu.
-- ============================================================
revoke select on public.pending_payments from anon, authenticated;

grant select (
  id,
  user_id,
  phone,
  amount,
  days,
  status,
  provider,
  network,
  created_at,
  paid_at,
  failure_reason
) on public.pending_payments to authenticated;
