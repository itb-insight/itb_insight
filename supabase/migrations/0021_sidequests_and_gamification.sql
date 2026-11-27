-- 0016: Sidequests, reward tiers, and gamification wireframe rules (PRD QRS-09..QRS-11).
--
-- 1. sidequests: catalog seeded from Gamification.xlsx ("Side Quest" sheet: Marketing, Acara,
--    Competition, Fundraise).
-- 2. sidequest_submissions: visitor submissions verified by website admins on D-Day (05:00 - 17:00 WIB).
-- 3. reward_tiers + reward_claims: point range rewards ("Poin Hadiah" sheet) with quota and
--    double-claim protection.
-- 4. booth_scan_events: allow negative admin manual adjustments (booth_id IS NULL) for error
--    corrections while keeping booth awards >= 0.

-- 1. Sidequests catalog
create table if not exists public.sidequests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 80),
  category text not null check (category in ('marketing', 'acara', 'competition', 'fundraise')),
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 1000),
  pic text check (pic is null or char_length(pic) <= 80),
  points integer not null default 5 check (points >= 0 and points <= 1000),
  shortcut_url text check (shortcut_url is null or char_length(shortcut_url) <= 500),
  requires_proof boolean not null default true,
  target_count integer not null default 1 check (target_count >= 1 and target_count <= 50),
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sidequests_category_order_idx
  on public.sidequests (category, order_index);

drop trigger if exists sidequests_set_updated_at on public.sidequests;
create trigger sidequests_set_updated_at
  before update on public.sidequests
  for each row execute function public.set_updated_at();

alter table public.sidequests enable row level security;

drop policy if exists "Anyone can read active sidequests" on public.sidequests;
create policy "Anyone can read active sidequests" on public.sidequests
  for select
  using (is_active = true or public.is_admin((select auth.uid())));

drop policy if exists "Admins can manage sidequests" on public.sidequests;
create policy "Admins can manage sidequests" on public.sidequests
  for all
  using (public.is_admin((select auth.uid())));

revoke all on public.sidequests from anon, authenticated;
grant select on public.sidequests to anon, authenticated;
grant select, insert, update, delete on public.sidequests to service_role;

-- 2. Sidequest submissions (verified by admin on D-Day)
create table if not exists public.sidequest_submissions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.sidequests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_url text check (proof_url is null or char_length(proof_url) <= 1000),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  points_awarded integer not null default 0 check (points_awarded >= 0 and points_awarded <= 1000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text check (review_note is null or char_length(review_note) <= 500),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (quest_id, user_id),
  constraint sidequest_submissions_points_consistency check (
    (status = 'approved' and points_awarded >= 0)
    or (status <> 'approved' and points_awarded = 0)
  )
);

create index if not exists sidequest_submissions_user_idx
  on public.sidequest_submissions (user_id, status);
create index if not exists sidequest_submissions_status_idx
  on public.sidequest_submissions (status, submitted_at desc);

drop trigger if exists sidequest_submissions_set_updated_at on public.sidequest_submissions;
create trigger sidequest_submissions_set_updated_at
  before update on public.sidequest_submissions
  for each row execute function public.set_updated_at();

alter table public.sidequest_submissions enable row level security;

drop policy if exists "Users can read own sidequest submissions" on public.sidequest_submissions;
create policy "Users can read own sidequest submissions" on public.sidequest_submissions
  for select
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

revoke all on public.sidequest_submissions from anon, authenticated;
grant select on public.sidequest_submissions to authenticated;
grant select, insert, update, delete on public.sidequest_submissions to service_role;

-- 3. Reward tiers & claims ("Poin Hadiah" sheet, PRD QRS-11)
create table if not exists public.reward_tiers (
  id uuid primary key default gen_random_uuid(),
  tier_number integer not null unique check (tier_number >= 1),
  min_points integer not null check (min_points >= 0),
  max_points integer not null check (max_points >= min_points),
  reward_name text not null check (char_length(reward_name) between 1 and 150),
  total_stock integer check (total_stock is null or total_stock >= 0),
  note text check (note is null or char_length(note) <= 300),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists reward_tiers_set_updated_at on public.reward_tiers;
create trigger reward_tiers_set_updated_at
  before update on public.reward_tiers
  for each row execute function public.set_updated_at();

alter table public.reward_tiers enable row level security;

drop policy if exists "Anyone can read active reward tiers" on public.reward_tiers;
create policy "Anyone can read active reward tiers" on public.reward_tiers
  for select
  using (is_active = true or public.is_admin((select auth.uid())));

revoke all on public.reward_tiers from anon, authenticated;
grant select on public.reward_tiers to anon, authenticated;
grant select, insert, update, delete on public.reward_tiers to service_role;

create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.reward_tiers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points_at_claim integer not null check (points_at_claim >= 0),
  claimed_by uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz not null default now(),
  unique (tier_id, user_id)
);

create index if not exists reward_claims_user_idx on public.reward_claims (user_id);

alter table public.reward_claims enable row level security;

drop policy if exists "Users can read own reward claims" on public.reward_claims;
create policy "Users can read own reward claims" on public.reward_claims
  for select
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

revoke all on public.reward_claims from anon, authenticated;
grant select on public.reward_claims to authenticated;
grant select, insert, update, delete on public.reward_claims to service_role;

-- 4. Allow negative manual point adjustments on booth_scan_events when booth_id is null
alter table public.booth_scan_events
  drop constraint if exists booth_scan_events_points_awarded_check;

alter table public.booth_scan_events
  add constraint booth_scan_events_points_awarded_check
  check (
    (booth_id is not null and points_awarded >= 0 and points_awarded <= 1000)
    or (booth_id is null and points_awarded between -1000 and 1000)
  );

-- 5. Seed the 13 sidequests from Gamification.xlsx ("Side Quest" sheet)
insert into public.sidequests (slug, category, title, description, pic, points, shortcut_url, requires_proof, target_count, order_index)
values
  -- Marketing
  ('follow-ig-itb-insight', 'marketing', 'Follow IG @itb.insight', 'Follow akun Instagram resmi @itb.insight dan unggah bukti screenshot.', 'CPP', 10, 'https://www.instagram.com/itb.insight/', true, 1, 1),
  ('follow-tiktok-x-itb-insight', 'marketing', 'Follow Tiktok/X @itb_insight', 'Follow akun TikTok atau X @itb_insight dan unggah bukti screenshot.', 'CPP', 5, 'https://www.tiktok.com/@itb_insight', true, 1, 2),
  ('share-poster-story', 'marketing', 'Share Poster Acara ITB INSIGHT 2026 ke Story Kamu', 'Bagikan poster utama ITB Insight 2026 ke Instagram Story kamu.', 'CPP', 5, 'https://www.instagram.com/itb.insight/', true, 1, 3),
  ('registrasi-dday', 'marketing', 'Registrasi D-Day ITB INSIGHT 2026', 'Lakukan registrasi dan check-in kehadiran D-Day ITB Insight 2026.', 'CPP', 20, '/dashboard', false, 1, 4),
  ('add-yours-moment-dday', 'marketing', 'Up moment keseruan kamu menggunakan add yours di ITB INSIGHT 2026 (D-Day)', 'Unggah keseruan kamu di D-Day menggunakan stiker Add Yours ITB Insight 2026.', 'CPP', 10, 'https://www.instagram.com/itb.insight/', true, 1, 5),
  ('foto-kyubi-add-yours', 'marketing', 'Foto dengan Kyubi (Maskot ITB Insight) + Add Yours', 'Berfoto bersama maskot Kyubi dan bagikan ke Story menggunakan Add Yours.', 'CPP', 10, 'https://www.instagram.com/itb.insight/', true, 1, 6),
  ('ajak-3-teman-dday', 'marketing', 'Mengajak teman/keluarga min. 3 orang untuk registrasi d-day', 'Ajak minimal 3 teman atau keluarga untuk hadir dan registrasi di D-Day ITB Insight.', 'SP', 15, null, true, 3, 7),
  -- Acara
  ('visit-booth-tech-show', 'acara', 'Mengunjungi Booth Tech Show (x/2)', 'Kunjungi minimal 2 Booth Tech Show dan tunjukkan QR profil kamu ke staf booth.', null, 5, '/event-map', false, 2, 8),
  ('talkshow-seminar-share', 'acara', 'Mengikuti Talkshow Seminar - Share pengalaman mu disini!', 'Ikuti sesi Talkshow Seminar dan bagikan pengalamanmu.', null, 5, '/event', true, 1, 9),
  ('isi-kesan-pesan', 'acara', 'Isi Kesan Pesanmu Hari Ini!', 'Isi formulir evaluasi kesan & pesan pengunjung ITB Insight hari ini.', null, 10, '/feedback/general', false, 1, 10),
  -- Competition
  ('visit-booth-eng-case', 'competition', 'Mengunjungi Booth Engineering Case Competition', 'Kunjungi booth pameran Engineering Case Competition.', 'Eng Compe', 5, '/competition', true, 1, 11),
  ('nonton-drone-soccer', 'competition', 'Menonton Drone Soccer Competition', 'Saksikan pertandingan Drone Soccer Competition secara langsung di arena.', 'Drone Compe', 5, '/competition/microdrone-obstacle-race', true, 1, 12),
  -- Fundraise
  ('beli-merch-foto', 'fundraise', 'Beli Merch ITB INSIGHT 2026 + upload your photo here with the merch', 'Beli official merchandise ITB Insight 2026 dan unggah fotomu bersama merch tersebut.', 'Entre', 15, null, true, 1, 13),
  ('visit-booth-sponsor', 'fundraise', 'Mengunjungi Booth Sponsor (x/2)', 'Kunjungi minimal 2 Booth Sponsor dan tunjukkan QR profil kamu ke staf booth.', 'Sponsor', 5, '/event-map', false, 2, 14)
on conflict (slug) do update
  set category = excluded.category,
      title = excluded.title,
      description = excluded.description,
      pic = excluded.pic,
      points = excluded.points,
      shortcut_url = excluded.shortcut_url,
      requires_proof = excluded.requires_proof,
      target_count = excluded.target_count,
      order_index = excluded.order_index;

-- 6. Seed reward tiers from Gamification.xlsx ("Poin Hadiah" sheet)
insert into public.reward_tiers (tier_number, min_points, max_points, reward_name, total_stock, note)
values
  (1, 100, 150, 'Sticker', null, null),
  (2, 151, 200, 'Tier 2 Reward (TBA)', null, null),
  (3, 201, 250, 'Tier 3 Reward (TBA)', null, null),
  (4, 251, 300, 'Tier 4 Reward (TBA)', null, null),
  (5, 301, 350, 'Grand Prize (Top 3 Tercepat)', 3, 'Limited Top 3 orang Tercepat')
on conflict (tier_number) do update
  set min_points = excluded.min_points,
      max_points = excluded.max_points,
      reward_name = excluded.reward_name,
      total_stock = excluded.total_stock,
      note = excluded.note;
