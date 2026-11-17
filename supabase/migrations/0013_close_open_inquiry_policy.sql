-- Close direct inserts into partnership_inquiries.
--
-- 0007_backend_complete_schema let anon/authenticated insert any row through PostgREST with the
-- public anon key ("Anyone can submit inquiry", with check (true)): unlimited, unvalidated rows,
-- bypassing the API. The API writes with the service role, which RLS does not apply to, so the
-- policy is not needed for the form to work.
drop policy if exists "Anyone can submit inquiry" on public.partnership_inquiries;

-- Length limits on free text, so a later bug in the API cannot store megabytes per row.
-- NOT VALID: enforced on new writes without failing on existing rows.
alter table public.partnership_inquiries
  drop constraint if exists partnership_inquiries_field_lengths;
alter table public.partnership_inquiries
  add constraint partnership_inquiries_field_lengths check (
    char_length(institution_name) <= 200
    and char_length(contact_person) <= 120
    and char_length(coalesce(job_title, '')) <= 120
    and char_length(coalesce(industry, '')) <= 120
    and char_length(coalesce(scale, '')) <= 60
    and char_length(email) <= 254
    and char_length(coalesce(phone, '')) <= 32
    and char_length(description) <= 4000
  ) not valid;
