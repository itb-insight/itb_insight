-- Booth awards: base points once per visitor per booth, repeat visits can only get bonus points.
--
-- Rules (src/lib/booths.ts, docs/SIDEQUESTS.md):
--   - kind 'visit':  the first award at a booth: booths.points + optional bonus. Once per visitor
--                    per booth, for the whole event (no cooldown).
--   - kind 'bonus':  a later award at the same booth ("Berikan Bonus?"): bonus points only.
--   - kind 'manual': admin correction with no booth (booth_id NULL), may be negative (0021).
--   The bonus a visitor gets at one booth, summed over all their rows there, never exceeds
--   booths.max_bonus_points. award_booth_bonus() enforces it under a row lock.
--
-- Before this migration unique (user_id, booth_id) allowed one row per booth; it now applies to
-- 'visit' rows only. Existing rows: booth_id NULL -> 'manual', everything else -> 'visit'.

alter table public.booth_scan_events
  add column if not exists kind text not null default 'visit';

update public.booth_scan_events
set kind = 'manual'
where booth_id is null and kind <> 'manual';

alter table public.booth_scan_events
  drop constraint if exists booth_scan_events_kind_check,
  drop constraint if exists booth_scan_events_bonus_row_check;

alter table public.booth_scan_events
  add constraint booth_scan_events_kind_check check (
    (kind = 'manual' and booth_id is null)
    or (kind in ('visit', 'bonus') and booth_id is not null)
  ),
  -- A bonus row is nothing but bonus.
  add constraint booth_scan_events_bonus_row_check check (
    kind <> 'bonus' or (points_awarded = bonus_points and bonus_points > 0)
  );

-- Drop the table-level unique (user_id, booth_id) from 0007, whatever it was named.
do $$
declare
  v_name text;
begin
  for v_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.booth_scan_events'::regclass
      and c.contype = 'u'
      and (
        select array_agg(a.attname::text order by a.attname)
        from unnest(c.conkey) k
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k
      ) = array['booth_id', 'user_id']
  loop
    execute format('alter table public.booth_scan_events drop constraint %I', v_name);
  end loop;
end
$$;

create unique index if not exists booth_scan_events_one_visit_per_booth
  on public.booth_scan_events (user_id, booth_id)
  where kind = 'visit';

create index if not exists booth_scan_events_user_booth_idx
  on public.booth_scan_events (user_id, booth_id);

-- Records a repeat-visit bonus. Returns the new row id, or NULL when nothing was written: no base
-- visit at this booth yet, bonus < 1, or the booth's bonus cap would be exceeded.
-- Locks the visit row so two staff phones cannot both spend the remaining bonus.
create or replace function public.award_booth_bonus(
  p_user uuid,
  p_booth uuid,
  p_bonus integer,
  p_awarded_by uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_max integer;
  v_used integer;
  v_id uuid;
begin
  if p_bonus is null or p_bonus < 1 then
    return null;
  end if;

  perform 1
  from public.booth_scan_events s
  where s.user_id = p_user and s.booth_id = p_booth and s.kind = 'visit'
  for update;
  if not found then
    return null;
  end if;

  select b.max_bonus_points into v_max from public.booths b where b.id = p_booth;

  select coalesce(sum(s.bonus_points), 0)::integer into v_used
  from public.booth_scan_events s
  where s.user_id = p_user and s.booth_id = p_booth;

  if v_max is null or v_used + p_bonus > v_max then
    return null;
  end if;

  insert into public.booth_scan_events (user_id, booth_id, kind, points_awarded, bonus_points, awarded_by)
  values (p_user, p_booth, 'bonus', p_bonus, p_bonus, p_awarded_by)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.award_booth_bonus(uuid, uuid, integer, uuid) from public, anon, authenticated;
grant execute on function public.award_booth_bonus(uuid, uuid, integer, uuid) to service_role;
