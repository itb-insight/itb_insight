-- 0008: align DB with the real competition catalog and remove an unsafe payment default.

-- 1. The 0002 seed created three placeholder competitions that do not exist on the public site.
--    Deactivate (not delete) so any rows already referencing them stay valid. The four real
--    competitions are created on demand by findOrCreateCompetitionRow() from src/lib/competitions.ts.
update public.competitions
set is_active = false
where slug in ('robotika-challenge', 'hackathon-innovation-sprint', 'paper-competition');

-- 2. payments.amount must always come from the server-side competition fee (CMP-14).
--    Dropping the 10000 default makes an insert without an explicit amount fail loudly instead of
--    silently billing a wrong amount.
alter table public.payments
  alter column amount drop default;
