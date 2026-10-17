-- Migration: Security hardening ahead of the public deploy.
-- 1. Drop the anon/authenticated INSERT policy on analytics_events. No app code writes to the
--    table (/api/track keeps events in memory), so the policy only let anyone holding the public
--    anon key insert spoofed rows (any user_id, unbounded props) straight through PostgREST.
-- 2. Restrict browser-side profile updates to the columns the profile form edits. API routes use
--    the service role, which is unaffected by these grants.
-- 3. Cap profile field lengths. NOT VALID enforces the limits on new writes without failing on
--    any existing oversized rows; run `alter table ... validate constraint` once they are clean.

-- Analytics events (guarded: 0006 may not be applied in every environment)
do $$
begin
  if to_regclass('public.analytics_events') is not null then
    drop policy if exists "Anyone can insert analytics events" on public.analytics_events;
  end if;
end
$$;

-- Profiles: column-level update grants
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, institution) on public.profiles to authenticated;

-- Profiles: field length limits
alter table public.profiles
  drop constraint if exists profiles_field_lengths;
alter table public.profiles
  add constraint profiles_field_lengths check (
    char_length(full_name) <= 120
    and char_length(coalesce(phone, '')) <= 32
    and char_length(coalesce(institution, '')) <= 200
  ) not valid;
