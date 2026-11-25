-- Committee divisions (bidang) for profiles.role_b.
--
-- 0011 allowed: booth | webdev | media | competition | event | sponsorship | partner.
-- The committee roster uses the organisation's bidang names instead:
--   gensec | creative | event | fundraising | competition | field | marketing
-- The 0011 values stay allowed so the constraint can be added without checking existing rows;
-- drop them in a later migration once no profile uses them.
--
-- role_b stays NULL unless role_a is staff / stakeholder (profiles_role_b_scope, unchanged).

alter table public.profiles
  drop constraint if exists profiles_role_b_check;

alter table public.profiles
  add constraint profiles_role_b_check
    check (role_b is null or role_b in (
      -- 0018: committee bidang
      'gensec', 'creative', 'event', 'fundraising', 'competition', 'field', 'marketing',
      -- 0011: legacy values
      'booth', 'webdev', 'media', 'sponsorship', 'partner'
    ));
