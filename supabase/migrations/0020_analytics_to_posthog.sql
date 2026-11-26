-- Web analytics moved to PostHog (src/lib/analytics/posthog.ts). The old ingest (/api/track)
-- that wrote here is gone; nothing reads or writes this table any more.
-- Export it first if you want to keep anything: this drop is not reversible.
drop table if exists public.analytics_events;

-- Per-competition registration funnel for /admin (Registration Funnel panel).
--   started   = teams created (team competitions) + individual registrations
--   completed = registrations that were not rejected
-- Aggregates only, no personal data. Called by the server with the service role; nobody else
-- may execute it.
create or replace function public.admin_competition_funnel()
returns table (competition_id uuid, competition_name text, started bigint, completed bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.name,
    (select count(*) from public.competition_teams t where t.competition_id = c.id)
      + (select count(*) from public.competition_registrations r
         where r.competition_id = c.id and r.registration_kind = 'individual'),
    (select count(*) from public.competition_registrations r
     where r.competition_id = c.id and r.status <> 'rejected')
  from public.competitions c
  where c.is_active
  order by c.name;
$$;

revoke execute on function public.admin_competition_funnel() from public, anon, authenticated;
grant execute on function public.admin_competition_funnel() to service_role;
