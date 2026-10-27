
-- KasiTrade POS - SMS Idempotency
-- Kuzuia ombi lilelile la SMS kutumwa mara mbili.
-- Hakuna table iliyopo inayofutwa au kubadilishwa.

CREATE TABLE IF NOT EXISTS public.sms_idempotency (
    request_key UUID PRIMARY KEY,

    payload_hash TEXT NOT NULL,

    kind TEXT NOT NULL CHECK (
        kind IN ('otp', 'welcome', 'password_reset', 'custom')
    ),

    user_id UUID,
    shop_id UUID,

    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'sent', 'failed', 'unknown')),

    provider_reference TEXT,
    error_code TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Index kwa ajili ya ufuatiliaji wa maombi.
CREATE INDEX IF NOT EXISTS sms_idempotency_created_idx
ON public.sms_idempotency (created_at DESC);

-- Linda taarifa za SMS.
ALTER TABLE public.sms_idempotency
ENABLE ROW LEVEL SECURITY;

-- Frontend hairuhusiwi kusoma au kubadilisha rekodi hizi moja kwa moja.
REVOKE ALL ON TABLE public.sms_idempotency
FROM anon, authenticated;

-- Supabase Edge Function itatumia service_role.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.sms_idempotency
TO service_role;
