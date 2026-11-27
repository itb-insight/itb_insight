-- D-day live panels in /admin (src/features/admin/data/live.ts, GET /api/admin/live).
-- One call returns today's on-site picture as JSON; the server caches it for 30 s, so the load is
-- at most one call per 30 s whatever the number of admins watching.
--
--   checked_in      distinct visitors with a gate check-in since p_since
--   active_now      distinct opted-in visitors with a presence ping in the last 5 minutes
--                   (a sample: only visitors who turned presence on and keep the page open)
--   presence_users  distinct opted-in visitors seen at the venue since p_since
--   slots           gate check-ins per 15 minutes
--   booths          per active booth: QR scans, presence visits >= p_visit_seconds (and how many
--                   distinct visitors made them), median and average dwell of those visits
--   venue           time at the venue per checked-in visitor: first gate check-in to their last
--                   scan or presence ping. Visitors with no activity after check-in are not
--                   measured (their time is unknown, not zero).

-- The booth leaderboard filters scans by time.
create index if not exists booth_scan_events_scanned_at_idx on public.booth_scan_events (scanned_at);

create or replace function public.admin_live_onsite(p_since timestamptz, p_visit_seconds integer default 300)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with
  checkins as (
    select g.user_id, min(g.checked_in_at) as first_in
    from public.gate_check_ins g
    where g.checked_in_at >= p_since
    group by g.user_id
  ),
  slots as (
    select date_bin('15 minutes', g.checked_in_at, p_since) as slot, count(*)::integer as n
    from public.gate_check_ins g
    where g.checked_in_at >= p_since
    group by 1
  ),
  presence as (
    select p.user_id, p.booth_id, p.last_seen_at,
           extract(epoch from (p.last_seen_at - p.first_seen_at))::integer as dwell
    from public.booth_presence p
    where p.last_seen_at >= p_since
  ),
  visits as (
    select pr.booth_id, pr.user_id, pr.dwell
    from presence pr
    where pr.booth_id is not null and pr.dwell >= p_visit_seconds
  ),
  scans as (
    select s.booth_id, s.user_id, s.scanned_at
    from public.booth_scan_events s
    where s.scanned_at >= p_since
  ),
  booth_rows as (
    select
      b.id,
      b.name,
      (select count(*) from scans s where s.booth_id = b.id)::integer as scans,
      (select count(*) from visits v where v.booth_id = b.id)::integer as visits,
      (select count(distinct v.user_id) from visits v where v.booth_id = b.id)::integer as visitors,
      (select round(percentile_cont(0.5) within group (order by v.dwell))::integer
         from visits v where v.booth_id = b.id) as median_dwell_s,
      (select round(avg(v.dwell))::integer from visits v where v.booth_id = b.id) as avg_dwell_s
    from public.booths b
    where b.is_active
  ),
  venue as (
    select extract(epoch from (la.last_at - la.first_in))::integer as secs
    from (
      select c.first_in,
             greatest(
               (select max(s.scanned_at) from scans s where s.user_id = c.user_id),
               (select max(pr.last_seen_at) from presence pr where pr.user_id = c.user_id)
             ) as last_at
      from checkins c
    ) la
    where la.last_at > la.first_in
  )
  select jsonb_build_object(
    'checked_in', (select count(*) from checkins),
    'active_now', (
      select count(distinct p.user_id)
      from public.booth_presence p
      where p.last_seen_at >= now() - interval '5 minutes'
    ),
    'presence_users', (select count(distinct pr.user_id) from presence pr),
    'slots', coalesce(
      (select jsonb_agg(jsonb_build_object('slot', sl.slot, 'count', sl.n) order by sl.slot) from slots sl),
      '[]'::jsonb
    ),
    'booths', coalesce(
      (select jsonb_agg(
         jsonb_build_object(
           'booth_id', br.id,
           'name', br.name,
           'scans', br.scans,
           'visits', br.visits,
           'visitors', br.visitors,
           'median_dwell_s', br.median_dwell_s,
           'avg_dwell_s', br.avg_dwell_s
         )
         order by br.visits desc, br.scans desc, br.name
       ) from booth_rows br),
      '[]'::jsonb
    ),
    'venue', jsonb_build_object(
      'measured', (select count(*) from venue),
      'median_s', (select round(percentile_cont(0.5) within group (order by v.secs))::integer from venue v),
      'under_30m', (select count(*) from venue v where v.secs < 1800),
      'from_30m_to_1h', (select count(*) from venue v where v.secs >= 1800 and v.secs < 3600),
      'from_1h_to_2h', (select count(*) from venue v where v.secs >= 3600 and v.secs < 7200),
      'over_2h', (select count(*) from venue v where v.secs >= 7200)
    )
  );
$$;

revoke execute on function public.admin_live_onsite(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.admin_live_onsite(timestamptz, integer) to service_role;
