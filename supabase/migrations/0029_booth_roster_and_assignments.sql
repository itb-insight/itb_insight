-- Booth roster for Tech-Xhibition, Play-Tech and Show-Tech, and per-booth staff assignments.
--
-- 1. booths: the real booths (Gamification sheet "2.1 Event PTST" / "2.2 Event Tech-Xhibition").
--    category = the event the booth belongs to, the same slugs as the event pages:
--      'tech-xhibition' (Aula Timur) | 'play-tech' (Lapangan Cinta) | 'show-tech' (CC Timur)
--    slug = <category>-<number on the layout>-<name>, so ordering by slug follows the layout.
--    Amounts ("0.2 Side Quest" sheet, Acara): booths.points is the Contribution, booths.max_bonus_points
--    the Bonus (src/lib/booth-points.ts). Every booth 5 + 5, the sponsor booths (Formulatrix, KAI) 10 + 5.
--    Tech-Xhibition 'v1' / 'v2': the outdoor vehicle tents (Cerberus car, Polban vehicle). They have
--    no LO; the Tech-Xhibition LOs scan there (the grant file assigns them).
--    qr_code is NOT NULL UNIQUE from the old booth-QR flow and no longer read: random filler.
--
-- 2. booth_staff_assignments: which booths a staff member may award at, keyed by email so a
--    booth can be assigned before the account exists. Resolved at request time against the
--    session's verified email (src/lib/booth-roster.ts loadAssignedBoothIds); an unverified email
--    counts for nothing (anyone can request a sign-in code for any address).
--    Rows are never deleted: revoking sets revoked_at / revoked_by, so the table is also the log of
--    every grant and revoke. Written by POST /api/booth-points/access (stakeholders with role_b
--    'booth', admins) and the SQL editor (assigned_by NULL). The old booth_staff table (0010,
--    keyed by user id) stays with the admin_roles flow (/api/booths/scan).
--
-- 3. Profile role changes (role_a / role_b / role_c) are logged to audit_logs
--    ('PROFILE_ROLE_CHANGED'), whatever made them: role grants (0019), the SQL editor, the API.
--
-- Booth access rules (who sees which booth) live in src/lib/booth-points.ts boothAccessFor.

-- 1. Booths -----------------------------------------------------------------------------------
insert into public.booths (slug, name, category, location_name, points, max_bonus_points, qr_code)
select v.slug, v.name, v.category, v.location_name, v.points, 5,
       'booth_' || replace(gen_random_uuid()::text, '-', '')
from (
  values
    -- Tech-Xhibition (Aula Timur): 25 booths + 2 outdoor vehicle tents
    ('tech-xhibition-01-cerberus-racing-team-itb', 'Cerberus Racing Team ITB', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-02-arthathonic', 'Arthathonic', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-03-robomarine-indonesia', 'Robomarine Indonesia', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-04-robonesia', 'Robonesia', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-05-puspa-iptek', 'Puspa Iptek', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-06-matrial', 'Matrial', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-07-aksantara', 'Aksantara', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-08-rakata', 'Rakata', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-09-politeknik-negeri-bandung', 'Politeknik Negeri Bandung', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-10-hmm-itb-rckt', 'HMM (Himpunan Mahasiswa Mesin) ITB / RCKT', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-11-kilatsoon', 'Kilatsoon', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-12-itb-de-labo', 'ITB De Labo', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-13-formulatrix', 'Formulatrix', 'tech-xhibition', 'Aula Timur', 10),
    ('tech-xhibition-14-kai-indonesia', 'KAI Indonesia', 'tech-xhibition', 'Aula Timur', 10),
    ('tech-xhibition-15-uniblock-unhas', 'Uniblock (Universitas Hasanuddin)', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-16-stand-tpt-1', 'Stand TPT 1', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-17-stand-tpt-2', 'Stand TPT 2', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-18-lab-pak-endra', 'Lab Pak Endra', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-19-lab-pak-iqbal', 'Lab Pak Iqbal', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-20-lab-pak-rr', 'Lab Pak RR', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-21-lab-pak-ashari', 'Lab Pak Ashari', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-22-lab-bu-vebi', 'Lab Bu Vebi', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-23-lab-pak-irsyad', 'Lab Pak Irsyad', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-24-lab-pak-eko', 'Lab Pak Eko', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-25-yaskawa-electric', 'YASKAWA Electric', 'tech-xhibition', 'Aula Timur', 5),
    ('tech-xhibition-v1-cerberus-vehicle', 'Kendaraan Cerberus Racing Team ITB', 'tech-xhibition', 'Parkiran VIP Aula Timur', 5),
    ('tech-xhibition-v2-polban-vehicle', 'Kendaraan Politeknik Negeri Bandung', 'tech-xhibition', 'Parkiran VIP Aula Timur', 5),
    -- Play-Tech (Lapangan Cinta): 20 wahana
    ('play-tech-01-buzz-wire', 'Buzz Wire', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-02-reaction-time-game', 'Reaction Time Game', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-03-tennis-led', 'Tennis LED', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-04-real-time-emotion-game', 'Real Time Emotion Game', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-05-arduino-maze-game', 'Arduino Maze Game', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-06-hand-gesture-controlled-car', 'Hand Gesture Controlled Car', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-07-flappy-pitch', 'Flappy Pitch', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-08-memory-sequence', 'Memory Sequence', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-09-robo-gripper', 'Robo Gripper', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-10-stars-swarm', 'Stars Swarm', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-11-67-counter', '67 Counter', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-12-mini-tetris', 'Mini Tetris', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-13-laser-shooting-range', 'Laser Shooting Range', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-14-robo-sumo', 'Robo Sumo', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-15-robo-shooter', 'Robo Shooter', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-16-robo-soccer', 'Robo Soccer', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-17-non-newtonian-fluid', 'Non-Newtonian Fluid', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-18-color-blaster', 'Color Blaster', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-19-waterpump-wind-turbine-tirga-raga', 'Waterpump Wind Turbine & Tirga Raga', 'play-tech', 'Lapangan Cinta', 5),
    ('play-tech-20-river-sweeper-royal-shuffler', 'River Sweeper & Royal Shuffler', 'play-tech', 'Lapangan Cinta', 5),
    -- Show-Tech (CC Timur): 11 in and on the way to the Gallery Room, Klung Bot out front
    ('show-tech-01-infinity-mirror', 'Infinity Mirror', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-02-spoon-piano', 'Spoon Piano', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-03-rainbow-cloud-lights', 'Rainbow Cloud Lights', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-04-hand-gesture-arm-robot-control', 'Hand Gesture Arm Robot Control', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-05-dobot-arm-robot', 'Dobot Arm Robot', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-06-mechanical-tulip-garden', 'Mechanical Tulip Garden', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-07-solar-tracker', 'Solar Tracker', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-08-ai-assistant', 'AI Assistant', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-09-kinect-playground', 'Kinect Playground', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-10-chroma-tunnel', 'Chroma Tunnel', 'show-tech', 'Gallery Room CC Timur', 5),
    ('show-tech-11-piano-stairs', 'Piano Stairs', 'show-tech', 'Tangga ke Gallery Room CC Timur', 5),
    ('show-tech-12-klung-bot', 'Klung Bot', 'show-tech', 'Depan Gedung CC Timur', 5)
) as v(slug, name, category, location_name, points)
on conflict (slug) do update
  set name = excluded.name,
      category = excluded.category,
      location_name = excluded.location_name,
      points = excluded.points,
      max_bonus_points = excluded.max_bonus_points;

-- 2. Booth staff assignments ------------------------------------------------------------------
create table if not exists public.booth_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  booth_id uuid not null references public.booths(id) on delete cascade,
  -- NULL = SQL editor (the grant file).
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  constraint booth_staff_assignments_email_format
    check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  constraint booth_staff_assignments_revoked_pair
    check (revoked_by is null or revoked_at is not null)
);

-- One live assignment per email and booth; revoked rows stay as history.
create unique index if not exists booth_staff_assignments_active_idx
  on public.booth_staff_assignments (email, booth_id)
  where revoked_at is null;

create index if not exists booth_staff_assignments_booth_idx
  on public.booth_staff_assignments (booth_id)
  where revoked_at is null;

create index if not exists booth_staff_assignments_assigned_at_idx
  on public.booth_staff_assignments (assigned_at desc);

create index if not exists booth_staff_assignments_revoked_at_idx
  on public.booth_staff_assignments (revoked_at desc)
  where revoked_at is not null;

alter table public.booth_staff_assignments enable row level security;
revoke all on public.booth_staff_assignments from anon, authenticated;
-- No delete: revoking is an update, so the history cannot be dropped through the API.
grant select, insert, update on public.booth_staff_assignments to service_role;

-- 3. Log profile role changes -----------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.log_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, target_table, record_id, metadata)
  values (
    (select auth.uid()), -- NULL from the SQL editor and the sign-in grant triggers
    'PROFILE_ROLE_CHANGED',
    'profiles',
    new.id::text,
    jsonb_build_object(
      'from', jsonb_build_object('role_a', old.role_a, 'role_b', old.role_b, 'role_c', old.role_c),
      'to', jsonb_build_object('role_a', new.role_a, 'role_b', new.role_b, 'role_c', new.role_c)
    )
  );
  return new;
end;
$$;

revoke execute on function private.log_profile_role_change() from public, anon, authenticated;

drop trigger if exists profiles_log_role_change on public.profiles;
create trigger profiles_log_role_change
  after update of role_a, role_b, role_c on public.profiles
  for each row
  when ((old.role_a, old.role_b, old.role_c) is distinct from (new.role_a, new.role_b, new.role_c))
  execute function private.log_profile_role_change();
