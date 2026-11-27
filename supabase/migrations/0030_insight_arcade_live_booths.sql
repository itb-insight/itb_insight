-- Insight Arcade, wave 1a: the game window and kill switch, live booth awards, new booths.
--
-- 1. arcade_settings: one row holding the game's runtime state, so it changes without a redeploy:
--      opens_at / freezes_at (06:00-14:50 WIB on D-day), claims_close_at (18:30), the grace for
--      late offline syncs, the kill switch (paused_at) and the results publication.
--    Kill switch from the SQL editor:  update public.arcade_settings set paused_at = now() where id = 1;
--    Resume:                           update public.arcade_settings set paused_at = null where id = 1;
-- 2. booth_scan_events gains captured_at (when the award happened; the window is judged on it),
--    client_ref (idempotency key: a retried or replayed award is written once), flash_id and flags.
-- 3. Rows dated before opens_at (rehearsals, tests) move to booth_scan_events_archive: they would
--    otherwise use up a visitor's "Contribution once" at that booth without counting.
-- 4. New booths for the other staff-scanned quests: Technology Seminar, Drone Soccer (play, JETE).
-- 5. arcade_is_committee(): committee accounts never earn, claim or rank. Committee = profile role,
--    admin_roles row, ADMIN_EMAILS (passed in), or an email with a live booth assignment.
-- 6. arcade_guard(): a trigger on every table that grants points or prizes. Refuses writes while
--    paused, and awards outside the window, whatever code path tries them (old routes included).
-- 7. arcade_award_booth(): the only booth award path. Contribution once and Bonus once per visitor
--    per booth, under a per (visitor, booth) lock, idempotent on client_ref.
--
-- Rules shared with the app: src/lib/booth-points.ts, src/lib/booth-award.ts, src/lib/arcade.ts.

-- 1. Settings ----------------------------------------------------------------------------------
create table if not exists public.arcade_settings (
  id smallint primary key default 1 check (id = 1),
  opens_at timestamptz not null,
  freezes_at timestamptz not null,
  claims_close_at timestamptz not null,
  sync_grace_minutes integer not null default 10 check (sync_grace_minutes between 0 and 120),
  pause_requested_at timestamptz,
  pause_requested_by uuid references public.profiles(id) on delete set null,
  paused_at timestamptz,
  paused_by uuid references public.profiles(id) on delete set null,
  results_published_at timestamptz,
  results_published_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint arcade_settings_order check (opens_at < freezes_at and freezes_at <= claims_close_at)
);

insert into public.arcade_settings (id, opens_at, freezes_at, claims_close_at)
values (1, '2026-11-28 06:00:00+07', '2026-11-28 14:50:00+07', '2026-11-28 18:30:00+07')
on conflict (id) do nothing;

drop trigger if exists arcade_settings_set_updated_at on public.arcade_settings;
create trigger arcade_settings_set_updated_at
  before update on public.arcade_settings
  for each row execute function public.set_updated_at();

alter table public.arcade_settings enable row level security;
revoke all on public.arcade_settings from anon, authenticated;
grant select, update on public.arcade_settings to service_role;

-- 2. booth_scan_events columns -------------------------------------------------------------------
alter table public.booth_scan_events
  add column if not exists captured_at timestamptz,
  add column if not exists client_ref uuid,
  add column if not exists flash_id uuid,
  add column if not exists flags text[] not null default '{}';

update public.booth_scan_events set captured_at = scanned_at where captured_at is null;

alter table public.booth_scan_events
  alter column captured_at set default now(),
  alter column captured_at set not null;

create unique index if not exists booth_scan_events_client_ref_idx
  on public.booth_scan_events (client_ref)
  where client_ref is not null;

create index if not exists booth_scan_events_captured_at_idx
  on public.booth_scan_events (captured_at);

-- 3. Archive rows from before the game ------------------------------------------------------------
create table if not exists public.booth_scan_events_archive (like public.booth_scan_events including defaults);
alter table public.booth_scan_events_archive
  add column if not exists archived_at timestamptz not null default now();

alter table public.booth_scan_events_archive enable row level security;
revoke all on public.booth_scan_events_archive from anon, authenticated;
grant select on public.booth_scan_events_archive to service_role;

with moved as (
  delete from public.booth_scan_events s
  using public.arcade_settings a
  where a.id = 1 and s.scanned_at < a.opens_at
  returning s.*
)
insert into public.booth_scan_events_archive
select m.*, now() from moved m;

-- 4. Booths for the other staff-scanned quests (no bonus) -----------------------------------------
insert into public.booths (slug, name, category, location_name, points, max_bonus_points, qr_code)
select v.slug, v.name, v.category, v.location_name, v.points, 0,
       'booth_' || replace(gen_random_uuid()::text, '-', '')
from (
  values
    ('seminar-01-technology-seminar', 'Technology Seminar (Talkshow)', 'seminar', 'Auditorium IPTEKS CC Timur', 5),
    ('drone-soccer-01-main', 'Main Drone Soccer', 'drone-soccer', 'Parkiran Labtek V', 15),
    ('drone-soccer-02-booth-jete', 'Booth Sponsor JETE', 'drone-soccer', 'Parkiran Labtek V', 10)
) as v(slug, name, category, location_name, points)
on conflict (slug) do update
  set name = excluded.name,
      category = excluded.category,
      location_name = excluded.location_name,
      points = excluded.points,
      max_bonus_points = excluded.max_bonus_points;

-- 5. Committee check ------------------------------------------------------------------------------
create or replace function public.arcade_is_committee(p_user uuid, p_admin_emails text[] default '{}')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.profiles p where p.id = p_user and p.role_a is not null)
    or exists (select 1 from public.admin_roles r where r.user_id = p_user)
    or exists (
      select 1
      from auth.users u
      left join public.profiles p on p.id = u.id
      cross join lateral (
        select array_remove(array[lower(btrim(u.email)), lower(btrim(p.email))], null) as emails
      ) e
      where u.id = p_user
        and (
          e.emails && coalesce(p_admin_emails, '{}'::text[])
          or exists (
            select 1
            from public.booth_staff_assignments a
            where a.revoked_at is null and a.email = any (e.emails)
          )
        )
    );
$$;

revoke execute on function public.arcade_is_committee(uuid, text[]) from public, anon, authenticated;
grant execute on function public.arcade_is_committee(uuid, text[]) to service_role;

-- 6. Guard trigger -------------------------------------------------------------------------------
create or replace function public.arcade_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.arcade_settings;
begin
  select * into s from public.arcade_settings where id = 1;
  if not found then
    return new;
  end if;

  if tg_table_name = 'booth_scan_events' then
    if s.paused_at is not null then
      raise exception 'ARCADE_PAUSED';
    end if;
    -- Manual rows are help-desk corrections: allowed outside the window (until results go out).
    if new.kind <> 'manual' and (
      new.captured_at < s.opens_at
      or new.captured_at > s.freezes_at
      or now() > s.freezes_at + make_interval(mins => s.sync_grace_minutes)
    ) then
      raise exception 'ARCADE_CLOSED';
    end if;
    return new;
  end if;

  if tg_table_name = 'sidequest_submissions' then
    if new.status = 'approved' and (
      tg_op = 'INSERT'
      or old.status is distinct from 'approved'
      or new.points_awarded is distinct from old.points_awarded
    ) then
      if s.paused_at is not null then
        raise exception 'ARCADE_PAUSED';
      end if;
      if new.submitted_at < s.opens_at or new.submitted_at > s.freezes_at then
        raise exception 'ARCADE_CLOSED';
      end if;
    end if;
    return new;
  end if;

  if tg_table_name = 'reward_claims' then
    if s.paused_at is not null then
      raise exception 'ARCADE_PAUSED';
    end if;
    if now() < s.opens_at or now() > s.claims_close_at then
      raise exception 'ARCADE_CLOSED';
    end if;
    return new;
  end if;

  return new;
end;
$$;

revoke execute on function public.arcade_guard() from public, anon, authenticated;

drop trigger if exists booth_scan_events_arcade_guard on public.booth_scan_events;
create trigger booth_scan_events_arcade_guard
  before insert on public.booth_scan_events
  for each row execute function public.arcade_guard();

drop trigger if exists sidequest_submissions_arcade_guard on public.sidequest_submissions;
create trigger sidequest_submissions_arcade_guard
  before insert or update on public.sidequest_submissions
  for each row execute function public.arcade_guard();

drop trigger if exists reward_claims_arcade_guard on public.reward_claims;
create trigger reward_claims_arcade_guard
  before insert on public.reward_claims
  for each row execute function public.arcade_guard();

-- 7. Booth award ---------------------------------------------------------------------------------
-- Returns { ok, code, ... }. ok = true: code 'AWARDED' (rows written) or 'DUPLICATE' (client_ref
-- already written: nothing new). Codes when ok = false: INVALID_OPTION, NOT_CONFIGURED, PAUSED,
-- TOO_OLD, NOT_OPEN, CLOSED, SELF_AWARD, COMMITTEE_ACCOUNT, BOOTH_NOT_FOUND, NO_BONUS, ALREADY_GIVEN.
-- `given` is what the visitor has at this booth afterwards.
create or replace function public.arcade_award_booth(
  p_user uuid,
  p_booth uuid,
  p_option text,
  p_awarded_by uuid,
  p_client_ref uuid default null,
  p_captured_at timestamptz default null,
  p_admin_emails text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.arcade_settings;
  v_now timestamptz := now();
  v_captured timestamptz;
  v_points integer;
  v_bonus_max integer;
  v_active boolean;
  v_visit boolean;
  v_bonus boolean;
  v_mult integer := 1;
  v_contribution integer := 0;
  v_bonus_pts integer := 0;
  v_id uuid;
begin
  if p_option is null or p_option not in ('contribution', 'bonus') then
    return jsonb_build_object('ok', false, 'code', 'INVALID_OPTION');
  end if;

  select * into s from public.arcade_settings where id = 1;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_CONFIGURED');
  end if;
  if s.paused_at is not null then
    return jsonb_build_object('ok', false, 'code', 'PAUSED');
  end if;

  -- The award time: the client's (offline queue) only when recent, never in the future.
  v_captured := least(coalesce(p_captured_at, v_now), v_now);
  if v_now - v_captured > interval '15 minutes' then
    return jsonb_build_object('ok', false, 'code', 'TOO_OLD');
  end if;
  if v_captured < s.opens_at then
    return jsonb_build_object('ok', false, 'code', 'NOT_OPEN', 'opensAt', s.opens_at);
  end if;
  if v_captured > s.freezes_at or v_now > s.freezes_at + make_interval(mins => s.sync_grace_minutes) then
    return jsonb_build_object('ok', false, 'code', 'CLOSED', 'freezesAt', s.freezes_at);
  end if;

  if p_user = p_awarded_by then
    return jsonb_build_object('ok', false, 'code', 'SELF_AWARD');
  end if;
  if public.arcade_is_committee(p_user, p_admin_emails) then
    return jsonb_build_object('ok', false, 'code', 'COMMITTEE_ACCOUNT');
  end if;

  select b.points, b.max_bonus_points, b.is_active into v_points, v_bonus_max, v_active
  from public.booths b
  where b.id = p_booth;
  if not found or not v_active then
    return jsonb_build_object('ok', false, 'code', 'BOOTH_NOT_FOUND');
  end if;

  -- Two staff phones scanning the same visitor at the same booth: one at a time.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_booth::text, 0));

  select
    coalesce(bool_or(e.kind = 'visit'), false),
    coalesce(bool_or(e.bonus_points > 0), false)
  into v_visit, v_bonus
  from public.booth_scan_events e
  where e.user_id = p_user and e.booth_id = p_booth;

  -- A replay of an award already written: report the current state, write nothing.
  if p_client_ref is not null and exists (
    select 1 from public.booth_scan_events e where e.client_ref = p_client_ref
  ) then
    return jsonb_build_object(
      'ok', true, 'code', 'DUPLICATE', 'contribution', 0, 'bonus', 0, 'total', 0,
      'given', jsonb_build_object('contribution', v_visit, 'bonus', v_bonus)
    );
  end if;

  if p_option = 'contribution' then
    if v_visit or v_bonus then
      return jsonb_build_object(
        'ok', false, 'code', 'ALREADY_GIVEN',
        'given', jsonb_build_object('contribution', v_visit, 'bonus', v_bonus)
      );
    end if;
    v_contribution := v_points * v_mult;
    insert into public.booth_scan_events
      (user_id, booth_id, kind, points_awarded, bonus_points, awarded_by, client_ref, captured_at)
    values
      (p_user, p_booth, 'visit', v_contribution, 0, p_awarded_by, p_client_ref, v_captured)
    returning id into v_id;
    v_visit := true;
  else
    if coalesce(v_bonus_max, 0) <= 0 then
      return jsonb_build_object('ok', false, 'code', 'NO_BONUS');
    end if;
    if v_bonus then
      return jsonb_build_object(
        'ok', false, 'code', 'ALREADY_GIVEN',
        'given', jsonb_build_object('contribution', v_visit, 'bonus', v_bonus)
      );
    end if;
    -- A Bonus first also gives the Contribution.
    if not v_visit then
      v_contribution := v_points * v_mult;
      insert into public.booth_scan_events
        (user_id, booth_id, kind, points_awarded, bonus_points, awarded_by, captured_at)
      values
        (p_user, p_booth, 'visit', v_contribution, 0, p_awarded_by, v_captured);
      v_visit := true;
    end if;
    v_bonus_pts := v_bonus_max * v_mult;
    insert into public.booth_scan_events
      (user_id, booth_id, kind, points_awarded, bonus_points, awarded_by, client_ref, captured_at)
    values
      (p_user, p_booth, 'bonus', v_bonus_pts, v_bonus_pts, p_awarded_by, p_client_ref, v_captured)
    returning id into v_id;
    v_bonus := true;
  end if;

  return jsonb_build_object(
    'ok', true, 'code', 'AWARDED', 'id', v_id,
    'contribution', v_contribution, 'bonus', v_bonus_pts, 'total', v_contribution + v_bonus_pts,
    'given', jsonb_build_object('contribution', v_visit, 'bonus', v_bonus)
  );
end;
$$;

revoke execute on function public.arcade_award_booth(uuid, uuid, text, uuid, uuid, timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.arcade_award_booth(uuid, uuid, text, uuid, uuid, timestamptz, text[]) to service_role;

notify pgrst, 'reload schema';
