-- AzamPay: externalId ya kipekee kwa kila muamala (huunganisha callback na malipo)
alter table public.pending_payments add column if not exists external_id text;

create unique index if not exists pending_payments_external_id_uidx
  on public.pending_payments (external_id)
  where external_id is not null;
