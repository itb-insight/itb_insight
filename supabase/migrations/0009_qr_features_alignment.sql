-- 0009: Align QR attendance, geo-fencing, and booth points allocation with docs/QR-FEATURES.md

-- 1. Booth configuration: add max_bonus_points and perimeter_radius_meters
--    `points` represents the standard point value given on visit; `max_bonus_points` bounds
--    the bonus points Booth Staff may freely award for active participation / winning booth games.
alter table public.booths
  add column if not exists max_bonus_points integer not null default 50 check (max_bonus_points >= 0),
  add column if not exists perimeter_radius_meters double precision not null default 15 check (perimeter_radius_meters > 0);

-- 2. Booth scan events: track standard vs bonus point breakdown, staff actor, activity note, and geo-fence perimeter state
alter table public.booth_scan_events
  add column if not exists standard_points_awarded integer not null default 10 check (standard_points_awarded >= 0),
  add column if not exists bonus_points_awarded integer not null default 0 check (bonus_points_awarded >= 0),
  add column if not exists awarded_by uuid references public.profiles(id) on delete set null,
  add column if not exists activity_note text,
  add column if not exists within_perimeter boolean,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists booth_scan_events_set_updated_at on public.booth_scan_events;
create trigger booth_scan_events_set_updated_at
  before update on public.booth_scan_events
  for each row execute function public.set_updated_at();

-- Expand booth_scan_events read policy to include booth_staff
drop policy if exists "Users can read own booth scans" on public.booth_scan_events;
create policy "Users can read own booth scans" on public.booth_scan_events
  for select
  using (
    user_id = (select auth.uid())
    or public.has_role((select auth.uid()), 'booth_staff')
    or exists (
      select 1 from public.booths
      where booths.id = booth_scan_events.booth_id
        and booths.exhibitor_user_id = (select auth.uid())
    )
  );

-- 3. Visitor tickets: track live campus presence (entry & exit for live visitor count),
--    gate tutorial confirmation, and current geo-fenced booth perimeter
alter table public.visitor_tickets
  add column if not exists is_on_campus boolean not null default false,
  add column if not exists last_entered_at timestamptz,
  add column if not exists last_exited_at timestamptz,
  add column if not exists gate_confirmed boolean not null default false,
  add column if not exists current_booth_id uuid references public.booths(id) on delete set null,
  add column if not exists booth_perimeter_updated_at timestamptz;

-- 4. Gate check-ins: expand check_in_type constraint for campus geo-fence entry/exit events
alter table public.gate_check_ins
  drop constraint if exists gate_check_ins_check_in_type_check;

alter table public.gate_check_ins
  add constraint gate_check_ins_check_in_type_check
  check (check_in_type in ('staff_scan', 'self_scan', 'manual_lookup', 'geofence_enter', 'geofence_exit'));
