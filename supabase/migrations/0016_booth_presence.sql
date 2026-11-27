-- Booth presence (D-day engagement): opted-in visitors whose phone reports a location inside the
-- event zone. See src/lib/presence.ts and docs/analytics (D-day presence).
--
-- What is stored: which booth (or "in the venue, at no booth") and when. Never coordinates.
-- A visit is one row: first_seen_at .. last_seen_at, extended while pings keep arriving less than
-- 3 minutes apart. "Visited a booth" = a visit lasting 5 minutes or more; dwell = the same
-- difference. Both are computed in queries, not stored.
--
-- Presence never awards points: client GPS can be faked. Points stay with QR scans.

-- ─── Booth positions (real-world, not the map's coordinate_x/y) ──────────────
alter table public.booths
  add column if not exists lat double precision check (lat is null or lat between -90 and 90),
  add column if not exists lng double precision check (lng is null or lng between -180 and 180),
  add column if not exists presence_radius_m integer not null default 15
    check (presence_radius_m between 5 and 100);

comment on column public.booths.lat is 'Real-world latitude for booth presence (WGS84). Null = no presence matching.';
comment on column public.booths.presence_radius_m is 'A fix within this many metres of lat/lng counts as at this booth. Tune in the field test.';

-- ─── Consent ─────────────────────────────────────────────────────────────────
-- Set and cleared only by /api/presence/consent (service role). The column-level update grant on
-- profiles (0007) does not include it, so users cannot write it through PostgREST.
alter table public.profiles add column if not exists presence_consent_at timestamptz;

-- ─── Visits ──────────────────────────────────────────────────────────────────
create table if not exists public.booth_presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- null = inside the event zone but at no booth (used for time at the venue)
  booth_id uuid references public.booths(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ping_count integer not null default 1 check (ping_count >= 1),
  check (last_seen_at >= first_seen_at)
);

create index if not exists booth_presence_user_booth_idx on public.booth_presence (user_id, booth_id, last_seen_at desc);
create index if not exists booth_presence_booth_idx on public.booth_presence (booth_id, first_seen_at);
create index if not exists booth_presence_last_seen_idx on public.booth_presence (last_seen_at);

-- Service role only: RLS on, no policies, no grants to client roles.
alter table public.booth_presence enable row level security;
revoke all on public.booth_presence from anon, authenticated;
grant select, insert, update, delete on public.booth_presence to service_role;

-- Records one ping: extends the user's latest visit at that booth (or at no booth) when it was
-- seen less than 3 minutes ago, otherwise starts a new visit. Returns the visit's dwell so far.
create or replace function public.record_booth_presence(p_user uuid, p_booth uuid)
returns table (visit_id uuid, dwell_seconds integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select bp.id into v_id
  from public.booth_presence bp
  where bp.user_id = p_user
    and bp.booth_id is not distinct from p_booth
    and bp.last_seen_at > now() - interval '3 minutes'
  order by bp.last_seen_at desc
  limit 1;

  if v_id is null then
    insert into public.booth_presence (user_id, booth_id)
    values (p_user, p_booth)
    returning id into v_id;
  else
    update public.booth_presence
    set last_seen_at = now(), ping_count = ping_count + 1
    where id = v_id;
  end if;

  return query
    select bp.id, extract(epoch from (bp.last_seen_at - bp.first_seen_at))::integer
    from public.booth_presence bp
    where bp.id = v_id;
end;
$$;

revoke execute on function public.record_booth_presence(uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_booth_presence(uuid, uuid) to service_role;
