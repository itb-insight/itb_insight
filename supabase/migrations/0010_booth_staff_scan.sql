-- Booth points are awarded by booth staff scanning the visitor's personal QR
-- (docs/QR-FEATURES.md), replacing the earlier flow where the visitor scanned a booth QR.
--
-- 1. booth_staff: which booth(s) a booth_staff account scans for. Booth exhibitors
--    (booths.exhibitor_user_id) and admins may also award; admins must name the booth.
-- 2. booths.max_bonus_points: cap on the discretionary bonus on top of booths.points.
-- 3. booth_scan_events.bonus_points / awarded_by: audit who gave what.
--    points_awarded stays the total (base + bonus), so sum(points_awarded) is still the score.
-- 4. gate_check_ins.check_in_type gains 'booth_skipped_gate': a visitor who skipped the gate
--    is marked attending when booth staff confirm it at their first booth scan.

-- 1. Booth staff assignments
create table if not exists public.booth_staff (
  booth_id uuid not null references public.booths(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (booth_id, user_id)
);

create index if not exists booth_staff_user_id_idx on public.booth_staff (user_id);

alter table public.booth_staff enable row level security;

create policy "Staff read own booth assignments" on public.booth_staff
  for select
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

grant select, insert, update, delete on public.booth_staff to service_role;
revoke all on public.booth_staff from anon;
revoke insert, update, delete, truncate on public.booth_staff from authenticated;
grant select on public.booth_staff to authenticated;

-- 2. Bonus cap per booth
alter table public.booths
  add column if not exists max_bonus_points integer not null default 20
  check (max_bonus_points >= 0);

-- 3. Scan event audit columns
alter table public.booth_scan_events
  add column if not exists bonus_points integer not null default 0 check (bonus_points >= 0),
  add column if not exists awarded_by uuid references public.profiles(id) on delete set null;

-- 4. Skipped-gate attendance recorded from a booth
alter table public.gate_check_ins
  drop constraint if exists gate_check_ins_check_in_type_check;

alter table public.gate_check_ins
  add constraint gate_check_ins_check_in_type_check
  check (check_in_type in ('staff_scan', 'self_scan', 'manual_lookup', 'booth_skipped_gate'));
