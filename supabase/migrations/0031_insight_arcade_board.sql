-- Insight Arcade, wave 1b: the side-quest catalog, collections, the leaderboard, automatic quests.
--
-- 1. sidequests: the organisers' sheet ("0.2 Side Quest") under new arcade-* slugs. Every older row
--    is deactivated, so test submissions made against old slugs never attach to an Arcade quest.
--    New columns: verify (how a quest completes), area, needs_handle, needs_vote.
--      proof          photo upload, points at once, reviewers verify or void afterwards (wave 2)
--      auto_gate      first staff gate check-in on D-day
--      auto_feedback  a signed-in submission of the D-day feedback form (wave 2)
--      auto_referral  three invited accounts gate-checked (wave 2)
--    sidequest_submissions.source records where an approved row came from.
-- 2. arcade_collections: completion bonuses derived from counted booth visits. Nothing is stored
--    per player: the leaderboard computes them, so there is no race and corrections apply.
--      count_in  min_total distinct booths among `categories`
--      each_of   min_per_category booths in every one of `categories`
-- 3. arcade_award_auto(): idempotent award of an automatic quest (gate now; feedback / referral in
--    wave 2). arcade_backfill_gate(): awards gate check-ins made before the hook was deployed.
-- 4. arcade_leaderboard(): every player's points as one JSON value (no PostgREST row cap):
--    booth rows inside the window (manual rows until results are published), approved quests
--    submitted inside the window, and completed collections. Committee accounts are left out.
--    Order: points desc, the time the final score was reached, the first point, user id.

-- 1. Catalog -------------------------------------------------------------------------------------
alter table public.sidequests
  add column if not exists verify text not null default 'proof',
  add column if not exists area text,
  add column if not exists needs_handle text,
  add column if not exists needs_vote boolean not null default false;

alter table public.sidequests
  drop constraint if exists sidequests_verify_check,
  drop constraint if exists sidequests_needs_handle_check;

alter table public.sidequests
  add constraint sidequests_verify_check
    check (verify in ('proof', 'auto_gate', 'auto_feedback', 'auto_referral')),
  add constraint sidequests_needs_handle_check
    check (needs_handle is null or needs_handle in ('instagram', 'tiktok_x'));

alter table public.sidequest_submissions
  add column if not exists source text;

alter table public.sidequest_submissions
  drop constraint if exists sidequest_submissions_source_check;

alter table public.sidequest_submissions
  add constraint sidequest_submissions_source_check
    check (source is null or source in ('proof', 'gate', 'feedback', 'referral', 'manual'));

update public.sidequests set is_active = false where slug not like 'arcade-%' and is_active;

insert into public.sidequests
  (slug, category, title, description, pic, points, shortcut_url, requires_proof, target_count,
   order_index, verify, area, needs_handle, needs_vote, is_active)
values
  ('arcade-registrasi-dday', 'marketing', 'Registrasi D-Day ITB INSIGHT 2026',
   'Tunjukkan QR profilmu ke petugas di gate masuk. Poin masuk otomatis saat kamu di-scan.',
   'HR', 20, '/arcade/qr', false, 1, 1, 'auto_gate', null, null, false, true),
  ('arcade-follow-ig', 'marketing', 'Follow IG @itbinsight',
   'Follow Instagram @itbinsight, lalu unggah screenshot halaman profil yang menunjukkan kamu sudah follow.',
   'CPP', 10, 'https://www.instagram.com/itbinsight/', true, 1, 2, 'proof', null, 'instagram', false, true),
  ('arcade-follow-tiktok-x', 'marketing', 'Follow TikTok/X @itb_insight',
   'Follow TikTok atau X @itb_insight, lalu unggah screenshot yang menunjukkan kamu sudah follow.',
   'CPP', 5, 'https://www.tiktok.com/@itb_insight', true, 1, 3, 'proof', null, 'tiktok_x', false, true),
  ('arcade-share-poster-story', 'marketing', 'Share Poster ITB INSIGHT 2026 ke Story',
   'Bagikan poster ITB INSIGHT 2026 ke Story Instagram-mu, lalu unggah screenshot story-nya.',
   'CPP', 5, 'https://www.instagram.com/itbinsight/', true, 1, 4, 'proof', null, null, false, true),
  ('arcade-add-yours-dday', 'marketing', 'Up Moment Keseruan D-Day pakai Add Yours',
   'Unggah momen keseruanmu di ITB INSIGHT 2026 pakai stiker Add Yours, lalu unggah screenshot story-nya.',
   'CPP', 10, 'https://www.instagram.com/itbinsight/', true, 1, 5, 'proof', null, null, false, true),
  ('arcade-foto-kyubi', 'marketing', 'Foto dengan Kyubi + Add Yours',
   'Berfoto dengan Kyubi, maskot ITB Insight, bagikan pakai Add Yours, lalu unggah screenshot story-nya.',
   'CPP', 10, 'https://www.instagram.com/itbinsight/', true, 1, 6, 'proof', null, null, false, true),
  ('arcade-ajak-3-teman', 'marketing', 'Ajak 3 Teman/Keluarga ke D-Day',
   'Bagikan link undanganmu. Poin masuk setelah 3 orang yang kamu undang di-scan di gate masuk.',
   'SP', 15, '/arcade/invite', false, 3, 7, 'auto_referral', null, null, false, true),
  ('arcade-kesan-pesan', 'acara', 'Isi Kesan Pesanmu Hari Ini!',
   'Isi formulir kesan dan pesan ITB INSIGHT 2026 saat sudah login. Poin masuk otomatis.',
   'Event', 10, '/feedback/kesan-pesan-2026', false, 1, 8, 'auto_feedback', null, null, false, true),
  ('arcade-add-yours-play-tech', 'acara', 'Add Yours di Booth Play-Tech',
   'Unggah momen dan kesanmu di Play-Tech pakai Add Yours (Instagram @itbinsight), lalu unggah screenshot story-nya.',
   'PTST', 7, 'https://www.instagram.com/itbinsight/', true, 1, 9, 'proof', 'play-tech', null, false, true),
  ('arcade-add-yours-show-tech', 'acara', 'Add Yours di Booth Show-Tech',
   'Unggah momen dan kesanmu di Show-Tech pakai Add Yours (Instagram @itbinsight), lalu unggah screenshot story-nya.',
   'PTST', 7, 'https://www.instagram.com/itbinsight/', true, 1, 10, 'proof', 'show-tech', null, false, true),
  ('arcade-add-yours-tech-xhibition', 'acara', 'Add Yours di Tech-Xhibition',
   'Unggah momen dan kesanmu di Tech-Xhibition pakai Add Yours (Instagram @itbinsight), lalu unggah screenshot story-nya.',
   'Exhibition', 7, 'https://www.instagram.com/itbinsight/', true, 1, 11, 'proof', 'tech-xhibition', null, false, true),
  ('arcade-add-yours-seminar', 'acara', 'Add Yours di Seminar Technology',
   'Unggah momen dan kesanmu selama talkshow Seminar Technology pakai Add Yours, lalu unggah screenshot story-nya.',
   'Seminar', 7, 'https://www.instagram.com/itbinsight/', true, 1, 12, 'proof', 'seminar', null, false, true),
  ('arcade-nonton-drone-soccer', 'competition', 'Nonton Drone Soccer Competition',
   'Tonton pertandingan Drone Soccer di Parkiran Labtek V, unggah fotomu di arena, dan pilih tim yang kamu dukung.',
   'Compe: Challenge', 5, null, true, 1, 13, 'proof', 'drone-soccer', null, true, true),
  ('arcade-beli-merch', 'fundraise', 'Beli Merch ITB INSIGHT 2026',
   'Beli merchandise ITB INSIGHT 2026 di tenant Entre (Parkiran Labtek VIII), lalu unggah fotomu bersama merch-nya.',
   'Entre', 15, null, true, 1, 14, 'proof', 'merch', null, false, true)
on conflict (slug) do update
  set category = excluded.category,
      title = excluded.title,
      description = excluded.description,
      pic = excluded.pic,
      points = excluded.points,
      shortcut_url = excluded.shortcut_url,
      requires_proof = excluded.requires_proof,
      target_count = excluded.target_count,
      order_index = excluded.order_index,
      verify = excluded.verify,
      area = excluded.area,
      needs_handle = excluded.needs_handle,
      needs_vote = excluded.needs_vote,
      is_active = excluded.is_active;

-- 2. Collections ---------------------------------------------------------------------------------
create table if not exists public.arcade_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 80),
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 300),
  rule text not null check (rule in ('count_in', 'each_of')),
  categories text[] not null check (cardinality(categories) >= 1),
  min_total integer check (min_total is null or min_total >= 1),
  min_per_category integer check (min_per_category is null or min_per_category >= 1),
  bonus integer not null check (bonus between 0 and 200),
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint arcade_collections_rule_fields check (
    (rule = 'count_in' and min_total is not null)
    or (rule = 'each_of' and min_per_category is not null)
  )
);

alter table public.arcade_collections enable row level security;
revoke all on public.arcade_collections from anon, authenticated;
grant select, insert, update on public.arcade_collections to service_role;

insert into public.arcade_collections
  (slug, title, description, rule, categories, min_total, min_per_category, bonus, order_index)
values
  ('play-tech-explorer', 'Play-Tech Explorer', 'Main di 10 wahana Play-Tech.',
   'count_in', array['play-tech'], 10, null, 20, 1),
  ('show-tech-explorer', 'Show-Tech Explorer', 'Kunjungi 6 wahana Show-Tech.',
   'count_in', array['show-tech'], 6, null, 15, 2),
  ('tech-xhibition-explorer', 'Tech-Xhibition Explorer', 'Kunjungi 10 booth Tech-Xhibition.',
   'count_in', array['tech-xhibition'], 10, null, 20, 3),
  ('full-insight', 'Full Insight', 'Minimal 1 scan di Tech-Xhibition, Play-Tech, Show-Tech, Seminar, dan Drone Soccer.',
   'each_of', array['tech-xhibition', 'play-tech', 'show-tech', 'seminar', 'drone-soccer'], null, 1, 25, 4)
on conflict (slug) do nothing;

-- 3. Automatic quests ----------------------------------------------------------------------------
-- Returns { ok, code }: AWARDED, ALREADY (approved before), or a refusal: NOT_CONFIGURED, PAUSED,
-- NOT_OPEN, CLOSED, COMMITTEE_ACCOUNT, QUEST_NOT_FOUND. p_at: when it happened (backfill), else now.
create or replace function public.arcade_award_auto(
  p_user uuid,
  p_slug text,
  p_at timestamptz default null,
  p_admin_emails text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.arcade_settings;
  v_at timestamptz;
  v_quest_id uuid;
  v_points integer;
  v_verify text;
  v_id uuid;
begin
  select * into s from public.arcade_settings where id = 1;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_CONFIGURED');
  end if;
  if s.paused_at is not null then
    return jsonb_build_object('ok', false, 'code', 'PAUSED');
  end if;

  v_at := least(coalesce(p_at, now()), now());
  if v_at < s.opens_at then
    return jsonb_build_object('ok', false, 'code', 'NOT_OPEN');
  end if;
  if v_at > s.freezes_at then
    return jsonb_build_object('ok', false, 'code', 'CLOSED');
  end if;

  if public.arcade_is_committee(p_user, p_admin_emails) then
    return jsonb_build_object('ok', false, 'code', 'COMMITTEE_ACCOUNT');
  end if;

  select q.id, q.points, q.verify into v_quest_id, v_points, v_verify
  from public.sidequests q
  where q.slug = p_slug and q.verify <> 'proof';
  if not found then
    return jsonb_build_object('ok', false, 'code', 'QUEST_NOT_FOUND');
  end if;

  insert into public.sidequest_submissions
    (quest_id, user_id, status, points_awarded, submitted_at, reviewed_at, source)
  values
    (v_quest_id, p_user, 'approved', v_points, v_at, now(),
     case v_verify when 'auto_gate' then 'gate' when 'auto_feedback' then 'feedback' else 'referral' end)
  on conflict (quest_id, user_id) do update
    set status = 'approved',
        points_awarded = excluded.points_awarded,
        submitted_at = excluded.submitted_at,
        reviewed_at = excluded.reviewed_at,
        source = excluded.source
    where public.sidequest_submissions.status <> 'approved'
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('ok', true, 'code', 'ALREADY');
  end if;
  return jsonb_build_object('ok', true, 'code', 'AWARDED', 'points', v_points);
end;
$$;

revoke execute on function public.arcade_award_auto(uuid, text, timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.arcade_award_auto(uuid, text, timestamptz, text[]) to service_role;

-- Gate check-ins (staff scan or manual desk lookup, never self check-in) inside the window that
-- have no Registrasi D-Day award yet. Safe to run any number of times. Returns how many it awarded.
create or replace function public.arcade_backfill_gate(p_admin_emails text[] default '{}')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_count integer := 0;
begin
  for r in
    select distinct on (g.user_id) g.user_id, g.checked_in_at
    from public.gate_check_ins g
    cross join public.arcade_settings s
    where s.id = 1
      and g.check_in_type in ('staff_scan', 'manual_lookup')
      and g.checked_in_at between s.opens_at and s.freezes_at
    order by g.user_id, g.checked_in_at
  loop
    if (public.arcade_award_auto(r.user_id, 'arcade-registrasi-dday', r.checked_in_at, p_admin_emails)->>'code') = 'AWARDED' then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

revoke execute on function public.arcade_backfill_gate(text[]) from public, anon, authenticated;
grant execute on function public.arcade_backfill_gate(text[]) to service_role;

-- 4. Leaderboard ---------------------------------------------------------------------------------
-- { players, entries: [{ rank, userId, name, institution, points, lastAt }] } for every player
-- with more than 0 points. Read by the server only (names are shortened before they go public).
create or replace function public.arcade_leaderboard(p_admin_emails text[] default '{}')
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select opens_at, freezes_at, results_published_at from public.arcade_settings where id = 1
  ),
  staff_emails as (
    select a.email from public.booth_staff_assignments a where a.revoked_at is null
    union
    select unnest(coalesce(p_admin_emails, '{}'::text[]))
  ),
  committee as (
    select p.id as user_id from public.profiles p where p.role_a is not null
    union
    select r.user_id from public.admin_roles r
    union
    select u.id from auth.users u join staff_emails e on e.email = lower(btrim(u.email))
    union
    select p.id from public.profiles p join staff_emails e on e.email = lower(btrim(p.email))
  ),
  booth_rows as (
    select e.user_id, e.booth_id, e.kind, e.points_awarded as points,
           case when e.kind = 'manual' then e.scanned_at else e.captured_at end as at
    from public.booth_scan_events e
    cross join s
    where (e.kind <> 'manual' and e.captured_at between s.opens_at and s.freezes_at)
       or (e.kind = 'manual' and e.scanned_at >= s.opens_at
           and (s.results_published_at is null or e.scanned_at <= s.results_published_at))
  ),
  quest_rows as (
    select q.user_id, q.points_awarded as points, q.submitted_at as at
    from public.sidequest_submissions q
    cross join s
    where q.status = 'approved' and q.submitted_at between s.opens_at and s.freezes_at
  ),
  visits as (
    select b.user_id, b.booth_id, bo.category, b.at
    from booth_rows b
    join public.booths bo on bo.id = b.booth_id
    where b.kind = 'visit'
  ),
  collection_hits as (
    select c.id as collection_id, c.rule, c.bonus, c.min_total, c.min_per_category,
           cardinality(c.categories) as n_categories,
           v.user_id, v.category, v.at,
           row_number() over (partition by c.id, v.user_id order by v.at, v.booth_id) as n_total,
           row_number() over (partition by c.id, v.user_id, v.category order by v.at, v.booth_id) as n_cat
    from public.arcade_collections c
    join visits v on v.category = any (c.categories)
    where c.is_active
  ),
  collection_rows as (
    select h.user_id, h.bonus as points, h.at
    from collection_hits h
    where h.rule = 'count_in' and h.n_total = h.min_total
    union all
    select h.user_id, max(h.bonus) as points, max(h.at) as at
    from collection_hits h
    where h.rule = 'each_of' and h.n_cat = h.min_per_category
    group by h.user_id, h.collection_id
    having count(distinct h.category) = max(h.n_categories)
  ),
  all_rows as (
    select user_id, points, at from booth_rows
    union all
    select user_id, points, at from quest_rows
    union all
    select user_id, points, at from collection_rows
  ),
  totals as (
    select r.user_id, sum(r.points)::integer as points, max(r.at) as last_at, min(r.at) as first_at
    from all_rows r
    where not exists (select 1 from committee c where c.user_id = r.user_id)
    group by r.user_id
    having sum(r.points) > 0
  ),
  ranked as (
    select t.*, row_number() over (order by t.points desc, t.last_at, t.first_at, t.user_id) as rank
    from totals t
  )
  select jsonb_build_object(
    'players', (select count(*) from ranked),
    'entries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'rank', r.rank,
          'userId', r.user_id,
          'name', coalesce(p.full_name, ''),
          'institution', p.institution,
          'points', r.points,
          'lastAt', r.last_at
        )
        order by r.rank
      )
      from ranked r
      left join public.profiles p on p.id = r.user_id
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.arcade_leaderboard(text[]) from public, anon, authenticated;
grant execute on function public.arcade_leaderboard(text[]) to service_role;

notify pgrst, 'reload schema';
