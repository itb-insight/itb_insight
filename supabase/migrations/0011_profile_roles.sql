-- Profile role columns.
--   role_a: user type            staff | stakeholder | sponsor_partner | company | admin
--   role_b: division             booth | webdev | media | competition | event | sponsorship | partner
--           only for staff / stakeholder, otherwise NULL
--   role_c: sponsor/partner org  only for sponsor_partner, otherwise NULL.
--           Free text for now: the company list (companyA/B/C) is temporary, so it is not
--           pinned with a CHECK that would need a migration for every new partner.
--
-- Not user-writable: 0007_security_hardening grants authenticated users UPDATE on
-- (full_name, phone, institution) only, and profiles has no INSERT policy, so these columns
-- can be set only by the service role (API) or the SQL editor. Keep it that way.

alter table public.profiles
  add column if not exists role_a text,
  add column if not exists role_b text,
  add column if not exists role_c text;

alter table public.profiles
  drop constraint if exists profiles_role_a_check,
  drop constraint if exists profiles_role_b_check,
  drop constraint if exists profiles_role_c_length,
  drop constraint if exists profiles_role_b_scope,
  drop constraint if exists profiles_role_c_scope;

alter table public.profiles
  add constraint profiles_role_a_check
    check (role_a is null or role_a in ('staff', 'stakeholder', 'sponsor_partner', 'company', 'admin')),
  add constraint profiles_role_b_check
    check (role_b is null or role_b in ('booth', 'webdev', 'media', 'competition', 'event', 'sponsorship', 'partner')),
  add constraint profiles_role_c_length
    check (role_c is null or char_length(role_c) between 1 and 120),
  -- role_b only for staff / stakeholder
  add constraint profiles_role_b_scope
    check (role_b is null or role_a in ('staff', 'stakeholder')),
  -- role_c only for sponsor_partner
  add constraint profiles_role_c_scope
    check (role_c is null or role_a = 'sponsor_partner');

-- Defensive: make sure no API role can write the role columns directly.
revoke update (role_a, role_b, role_c) on public.profiles from anon, authenticated;
