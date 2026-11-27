-- D-day page in /admin (src/app/admin/d-day, GET /api/admin/d-day), open to every staff member.
--
-- profiles.left_area_at: the last time this visitor's phone reported being outside the event zone
--   (POST /api/presence/exit). Sent by the opt-in presence tracker the first time a page finds the
--   phone outside the zone, and again whenever it walks out of it. No coordinates are stored: only
--   the time. Server-written only: 0023 grants authenticated users update on
--   (full_name, phone, institution) alone.
--
-- admin_dday(p_since, p_assume_seconds, p_booth_target) returns the whole page as JSON. The server
-- caches it for 30 s, so many staff watching cost one call per 30 s.
--
--   live      the live headcount. A visitor's latest in-area signal is their latest gate check-in,
--             booth scan or presence ping. They are assumed to be in the area for p_assume_seconds
--             (5 h) after it, unless an exit (left_area_at) came after it. A visitor who never opens
--             the site again after the gate therefore counts for 5 h: after closing time the page
--             warns about that. A group (represented_count, 0027) counts with its representative.
--   summary   today: check-in rows, booth scan rows, points given at booths, reward claims.
--   gates     check-ins per 5 minutes per gate_name, last 12 hours (the page re-buckets them).
--   booths    per booth: scans and points today, scans in the heat map windows, position.
--   funnel    today's visitors, how many scanned at >= 1 / 5 / p_booth_target booths, claimed.
--   medians   check-in to first booth scan, and between booth scans, in seconds.
--   staff     per staff member and location: scans and points today (gate: checked_in_by,
--             booth: awarded_by).

alter table public.profiles add column if not exists left_area_at timestamptz;

comment on column public.profiles.left_area_at is
  'Last time the phone reported being outside the event zone (POST /api/presence/exit). Time only, no location.';

create or replace function public.admin_dday(
  p_since timestamptz,
  p_assume_seconds integer default 18000,
  p_booth_target integer default 15
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with
  bounds as (
    select now() - make_interval(secs => p_assume_seconds) as assume_from,
           least(p_since, now() - make_interval(secs => p_assume_seconds)) as signals_from
  ),
  signals as (
    select g.user_id, g.checked_in_at as at
    from public.gate_check_ins g, bounds b
    where g.checked_in_at >= b.signals_from
    union all
    select p.user_id, p.last_seen_at
    from public.booth_presence p, bounds b
    where p.last_seen_at >= b.signals_from
    union all
    select s.user_id, s.scanned_at
    from public.booth_scan_events s, bounds b
    where s.scanned_at >= b.signals_from and s.booth_id is not null
  ),
  last_in as (
    select sg.user_id, max(sg.at) as at
    from signals sg
    group by sg.user_id
  ),
  people as (
    select li.at,
           pf.represented_count,
           (pf.left_area_at is not null and pf.left_area_at >= li.at) as has_left,
           li.at >= b.assume_from as recent
    from last_in li
    join public.profiles pf on pf.id = li.user_id
    cross join bounds b
  ),
  checkins as (
    select g.user_id, g.gate_name, g.check_in_type, g.checked_in_at, g.checked_in_by
    from public.gate_check_ins g
    where g.checked_in_at >= p_since
  ),
  scans as (
    select s.user_id, s.booth_id, s.points_awarded, s.scanned_at, s.awarded_by
    from public.booth_scan_events s
    where s.scanned_at >= p_since and s.booth_id is not null
  ),
  visitors as (
    select c.user_id from checkins c
    union
    select s.user_id from scans s
  ),
  booth_counts as (
    select s.user_id, count(distinct s.booth_id) as n
    from scans s
    group by s.user_id
  ),
  first_checkin as (
    select c.user_id, min(c.checked_in_at) as at
    from checkins c
    group by c.user_id
  ),
  first_scan as (
    select s.user_id, min(s.scanned_at) as at
    from scans s
    group by s.user_id
  ),
  to_first_scan as (
    select extract(epoch from (fs.at - fc.at)) as secs
    from first_checkin fc
    join first_scan fs on fs.user_id = fc.user_id
    where fs.at >= fc.at
  ),
  -- A visitor's first scan at each booth (later rows there are bonuses), then the gaps between them.
  booth_firsts as (
    select s.user_id, min(s.scanned_at) as at
    from scans s
    group by s.user_id, s.booth_id
  ),
  scan_gaps as (
    select extract(epoch from (f.at - lag(f.at) over (partition by f.user_id order by f.at))) as secs
    from booth_firsts f
  ),
  gate_slots as (
    select date_bin('5 minutes', g.checked_in_at, p_since) as slot, g.gate_name, count(*)::integer as n
    from public.gate_check_ins g
    where g.checked_in_at >= now() - interval '12 hours'
    group by 1, 2
  ),
  booth_windows as (
    select s.booth_id,
           count(*) filter (where s.scanned_at >= now() - interval '30 minutes')::integer as m30,
           count(*) filter (where s.scanned_at >= now() - interval '1 hour')::integer as h1,
           count(*) filter (where s.scanned_at >= now() - interval '2 hours')::integer as h2,
           count(*) filter (where s.scanned_at >= now() - interval '5 hours')::integer as h5,
           count(*)::integer as h12
    from public.booth_scan_events s
    where s.booth_id is not null and s.scanned_at >= now() - interval '12 hours'
    group by s.booth_id
  ),
  booth_today as (
    select s.booth_id, count(*)::integer as scans, coalesce(sum(s.points_awarded), 0)::integer as points
    from scans s
    group by s.booth_id
  ),
  booth_rows as (
    select b.id, b.name, b.lat, b.lng, b.coordinate_x, b.coordinate_y,
           coalesce(t.scans, 0) as scans, coalesce(t.points, 0) as points,
           coalesce(w.m30, 0) as m30, coalesce(w.h1, 0) as h1, coalesce(w.h2, 0) as h2,
           coalesce(w.h5, 0) as h5, coalesce(w.h12, 0) as h12
    from public.booths b
    left join booth_today t on t.booth_id = b.id
    left join booth_windows w on w.booth_id = b.id
    where b.is_active or t.booth_id is not null
  ),
  staff_rows as (
    select 'gate' as kind, c.gate_name as location, c.checked_in_by as user_id,
           count(*)::integer as scans, 0 as points, max(c.checked_in_at) as last_at
    from checkins c
    where c.checked_in_by is not null
    group by c.gate_name, c.checked_in_by
    union all
    select 'booth', s.booth_id::text, s.awarded_by,
           count(*)::integer, coalesce(sum(s.points_awarded), 0)::integer, max(s.scanned_at)
    from scans s
    where s.awarded_by is not null
    group by s.booth_id, s.awarded_by
  )
  select jsonb_build_object(
    'live', jsonb_build_object(
      'accounts', (select count(*) from people p where p.recent and not p.has_left),
      'represented', (select coalesce(sum(p.represented_count), 0) from people p where p.recent and not p.has_left),
      'oldest_at', (select min(p.at) from people p where p.recent and not p.has_left),
      'newest_at', (select max(p.at) from people p where p.recent and not p.has_left),
      'left', (select count(*) from people p where p.has_left),
      'timed_out', (select count(*) from people p where not p.recent and not p.has_left),
      'tracked_now', (
        select count(distinct p.user_id)
        from public.booth_presence p
        where p.last_seen_at >= now() - interval '5 minutes'
      )
    ),
    'summary', jsonb_build_object(
      'check_ins', (select count(*) from checkins),
      'skipped_gate', (select count(*) from checkins c where c.check_in_type = 'booth_skipped_gate'),
      'booth_scans', (select count(*) from scans),
      'points_given', (select coalesce(sum(s.points_awarded), 0) from scans s),
      'booths_active', (select count(*) from public.booths b where b.is_active),
      'booth_visits', (select coalesce(sum(bc.n), 0) from booth_counts bc)
    ),
    'funnel', jsonb_build_object(
      'visitors', (select count(*) from visitors),
      'scanned_1', (select count(*) from booth_counts bc where bc.n >= 1),
      'scanned_5', (select count(*) from booth_counts bc where bc.n >= 5),
      'reached_target', (select count(*) from booth_counts bc where bc.n >= p_booth_target),
      'claimed', (select count(distinct r.user_id) from public.reward_claims r where r.claimed_at >= p_since)
    ),
    'medians', jsonb_build_object(
      'checkin_to_first_scan_s', (select round(percentile_cont(0.5) within group (order by t.secs))::integer from to_first_scan t),
      'between_scans_s', (select round(percentile_cont(0.5) within group (order by g.secs))::integer from scan_gaps g where g.secs is not null)
    ),
    'gates', coalesce(
      (select jsonb_agg(jsonb_build_object('slot', gs.slot, 'gate', gs.gate_name, 'count', gs.n) order by gs.slot) from gate_slots gs),
      '[]'::jsonb
    ),
    'booths', coalesce(
      (select jsonb_agg(
         jsonb_build_object(
           'id', br.id, 'name', br.name,
           'lat', br.lat, 'lng', br.lng, 'x', br.coordinate_x, 'y', br.coordinate_y,
           'scans', br.scans, 'points', br.points,
           'm30', br.m30, 'h1', br.h1, 'h2', br.h2, 'h5', br.h5, 'h12', br.h12
         )
         order by br.scans desc, br.name
       ) from booth_rows br),
      '[]'::jsonb
    ),
    'staff', coalesce(
      (select jsonb_agg(
         jsonb_build_object(
           'kind', sr.kind, 'location', sr.location, 'user_id', sr.user_id,
           'name', coalesce(nullif(pf.full_name, ''), 'Tanpa nama'),
           'role_a', pf.role_a, 'role_b', pf.role_b,
           'scans', sr.scans, 'points', sr.points, 'last_at', sr.last_at
         )
         order by sr.scans desc
       )
       from staff_rows sr
       left join public.profiles pf on pf.id = sr.user_id),
      '[]'::jsonb
    )
  );
$$;

revoke execute on function public.admin_dday(timestamptz, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_dday(timestamptz, integer, integer) to service_role;
