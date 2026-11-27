-- People one visitor represents (parents for their kids, teachers for their students), and the
-- headcounts that include them in the /admin "On Site Today" panel.
--
-- profiles.represented_count: how many people besides the account holder this visitor stands for.
--   Set by gate staff when they scan the visitor's QR with "mewakili lebih dari satu pengunjung"
--   ticked (POST /api/gate/scan). A later scan with the box ticked replaces it (a correction); a
--   scan with it unticked leaves it alone. Server-written only: 0023 grants authenticated users
--   update on (full_name, phone, institution) alone.
--
-- admin_live_onsite gains (the rest is unchanged from 0017):
--   represented_now   people represented by the visitors in active_now (tracked phones that
--                     pinged in the last 5 minutes): a group counts as in the area while its
--                     representative's phone is.
--   unique_visitors   everyone who has been in the event area, all time, only ever going up:
--                     profiles with visited_itb or entered_gate (0026, never reset) plus the
--                     people they represent.
--   represented_total the "plus" part of unique_visitors.

alter table public.profiles
  add column if not exists represented_count integer not null default 0
    check (represented_count between 0 and 200);

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
  ),
  active as (
    select distinct p.user_id
    from public.booth_presence p
    where p.last_seen_at >= now() - interval '5 minutes'
  ),
  visited as (
    select pf.represented_count
    from public.profiles pf
    where pf.visited_itb or pf.entered_gate
  )
  select jsonb_build_object(
    'checked_in', (select count(*) from checkins),
    'active_now', (select count(*) from active),
    'represented_now', (
      select coalesce(sum(pf.represented_count), 0)
      from public.profiles pf
      join active a on a.user_id = pf.id
    ),
    'unique_visitors', (select count(*) + coalesce(sum(v.represented_count), 0) from visited v),
    'represented_total', (select coalesce(sum(v.represented_count), 0) from visited v),
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
