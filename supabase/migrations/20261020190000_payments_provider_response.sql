-- Jibu la Vodacom (halina siri) linalohifadhiwa malipo yakifeli, kwa uchunguzi
alter table public.pending_payments add column if not exists provider_response jsonb;
