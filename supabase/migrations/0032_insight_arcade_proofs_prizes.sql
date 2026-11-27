-- Insight Arcade, wave 2: photo-proof side quests, reviews, the D-day feedback form, prizes.
--
-- 1. sidequest_submissions: proof_path (private bucket arcade-proofs), proof_sha256, handle (IG /
--    TikTok username: one account counts once per quest), vote_team_id (drone soccer), review_state
--    (unreviewed | verified | voided) and attempts. A first upload is approved at once with its
--    points; reviewers verify or void it afterwards. After a void the next upload waits for review
--    (pending). Two attempts per quest.
-- 2. arcade_duties: email-keyed reviewer / prize_desk duties, revoked not deleted. Duty holders are
--    committee (arcade_is_committee) and cannot earn points.
-- 3. Private storage bucket arcade-proofs (when the storage schema exists).
-- 4. Feedback form kesan-pesan-2026 (the sheet's questions). A signed-in submission pays the
--    "Isi Kesan Pesan" quest (src/lib/feedback/submit.ts).
-- 5. Prize tiers (tier numbers 101-103): Sticker (500, anyone with a completed quest), Mug (rank
--    1-5) and Keychain (rank 6-10, wave 3). The old point-range tiers are switched off.
-- 6. arcade_submit_proof(), arcade_review_proof(), arcade_claim_prize().

-- 1. Submission columns --------------------------------------------------------------------------
alter table public.sidequest_submissions
  add column if not exists proof_path text,
  add column if not exists proof_sha256 text,
  add column if not exists handle text,
  add column if not exists vote_team_id uuid references public.competition_teams(id) on delete set null,
  add column if not exists review_state text,
  add column if not exists attempts integer not null default 0;

alter table public.sidequest_submissions
  drop constraint if exists sidequest_submissions_review_state_check,
  drop constraint if exists sidequest_submissions_handle_check;

alter table public.sidequest_submissions
  add constraint sidequest_submissions_review_state_check
    check (review_state is null or review_state in ('unreviewed', 'verified', 'voided')),
  add constraint sidequest_submissions_handle_check
    check (handle is null or handle ~ '^[a-z0-9._]{1,40}$');

create unique index if not exists sidequest_submissions_handle_once
  on public.sidequest_submissions (quest_id, handle)
  where handle is not null and status in ('pending', 'approved');

create index if not exists sidequest_submissions_review_idx
  on public.sidequest_submissions (review_state, submitted_at)
  where source = 'proof';

-- 2. Duties --------------------------------------------------------------------------------------
create table if not exists public.arcade_duties (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  duty text not null check (duty in ('reviewer', 'prize_desk')),
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists arcade_duties_active_idx
  on public.arcade_duties (email, duty)
  where revoked_at is null;

alter table public.arcade_duties enable row level security;
revoke all on public.arcade_duties from anon, authenticated;
grant select, insert, update on public.arcade_duties to service_role;

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
            select 1 from public.booth_staff_assignments a
            where a.revoked_at is null and a.email = any (e.emails)
          )
          or exists (
            select 1 from public.arcade_duties d
            where d.revoked_at is null and d.email = any (e.emails)
          )
        )
    );
$$;

-- 3. Storage bucket ------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage')
     and exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'storage' and c.relname = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('arcade-proofs', 'arcade-proofs', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
  end if;
end
$$;

-- 4. Feedback form -------------------------------------------------------------------------------
insert into public.feedback_forms (slug, title, description, context, opens_at, closes_at, questions)
values (
  'kesan-pesan-2026',
  'Kesan & Pesan ITB INSIGHT 2026',
  'Ceritakan pengalamanmu hari ini. Login dulu supaya poin Insight Arcade-mu masuk.',
  'event',
  '2026-11-28 06:00:00+07',
  '2026-11-29 23:59:59+07',
  $json$[
    {"id": "origin", "type": "choice", "label": "Asal", "required": true, "options": [
      {"value": "sekolah", "label": "Sekolah"},
      {"value": "universitas", "label": "Universitas"},
      {"value": "perusahaan", "label": "Perusahaan"},
      {"value": "komunitas", "label": "Komunitas"},
      {"value": "daerah", "label": "Daerah / umum"}
    ]},
    {"id": "age", "type": "choice", "label": "Umur", "required": true, "options": [
      {"value": "3-10", "label": "3-10 tahun"},
      {"value": "11-18", "label": "11-18 tahun"},
      {"value": "19-22", "label": "19-22 tahun"},
      {"value": "23-30", "label": "23-30 tahun"},
      {"value": "30-40", "label": "30-40 tahun"},
      {"value": "40-plus", "label": "40+ tahun"}
    ]},
    {"id": "fun", "type": "stars", "label": "Seberapa seru rangkaian acara ITB Insight 2026?", "required": true, "overall": true},
    {"id": "favorite", "type": "choice", "label": "Acara apa yang paling kamu suka?", "required": true, "options": [
      {"value": "insight-on-stage", "label": "Insight on Stage"},
      {"value": "tech-xhibition", "label": "Tech-Xhibition"},
      {"value": "play-tech", "label": "Play-Tech"},
      {"value": "show-tech", "label": "Show-Tech"},
      {"value": "seminar", "label": "Seminar Technology"},
      {"value": "drone-soccer", "label": "Drone Soccer Competition"},
      {"value": "bazar", "label": "Bazar"}
    ]},
    {"id": "interest", "type": "choice", "label": "Setelah kegiatan ini, apakah kamu jadi lebih tertarik dengan sains dan teknologi?", "required": true, "options": [
      {"value": "ya", "label": "Ya"},
      {"value": "sedikit", "label": "Sedikit"},
      {"value": "belum", "label": "Belum"}
    ]},
    {"id": "suggestion", "type": "long", "label": "Apa saran kamu supaya kegiatan ini lebih seru lagi?", "required": false}
  ]$json$::jsonb
)
on conflict (slug) do nothing;

-- 5. Prize tiers ---------------------------------------------------------------------------------
update public.reward_tiers set is_active = false where tier_number < 100 and is_active;

insert into public.reward_tiers (tier_number, min_points, max_points, reward_name, total_stock, note, is_active)
values
  (101, 0, 0, 'Sticker ITB Insight 2026', 500, 'Siapa saja yang sudah menyelesaikan quest, selama stok ada.', true),
  (102, 0, 0, 'Mug ITB Insight 2026', 5, 'Peringkat akhir 1-5.', true),
  (103, 0, 0, 'Keychain ITB Insight 2026', 5, 'Peringkat akhir 6-10.', true)
on conflict (tier_number) do nothing;

-- 6. Functions -----------------------------------------------------------------------------------
-- Proof upload. { ok, code }: AWARDED (instant points), PENDING (re-upload after a void: reviewed
-- first), or a refusal: PAUSED, NOT_OPEN, CLOSED, COMMITTEE_ACCOUNT, QUEST_NOT_FOUND, ALREADY,
-- NO_MORE_ATTEMPTS, HANDLE_REQUIRED, HANDLE_INVALID, VOTE_REQUIRED, HANDLE_USED.
create or replace function public.arcade_submit_proof(
  p_user uuid,
  p_slug text,
  p_path text,
  p_sha256 text,
  p_handle text default null,
  p_vote_team uuid default null,
  p_admin_emails text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.arcade_settings;
  q record;
  existing record;
  v_handle text := nullif(ltrim(lower(btrim(coalesce(p_handle, ''))), '@'), '');
begin
  select * into s from public.arcade_settings where id = 1;
  if s.paused_at is not null then return jsonb_build_object('ok', false, 'code', 'PAUSED'); end if;
  if now() < s.opens_at then return jsonb_build_object('ok', false, 'code', 'NOT_OPEN'); end if;
  if now() > s.freezes_at then return jsonb_build_object('ok', false, 'code', 'CLOSED'); end if;
  if public.arcade_is_committee(p_user, p_admin_emails) then
    return jsonb_build_object('ok', false, 'code', 'COMMITTEE_ACCOUNT');
  end if;

  select id, points, needs_handle, needs_vote into q
  from public.sidequests
  where slug = p_slug and verify = 'proof' and is_active;
  if not found then return jsonb_build_object('ok', false, 'code', 'QUEST_NOT_FOUND'); end if;
  if q.needs_handle is not null and v_handle is null then
    return jsonb_build_object('ok', false, 'code', 'HANDLE_REQUIRED');
  end if;
  if v_handle is not null and v_handle !~ '^[a-z0-9._]{1,40}$' then
    return jsonb_build_object('ok', false, 'code', 'HANDLE_INVALID');
  end if;
  if q.needs_vote and p_vote_team is null then
    return jsonb_build_object('ok', false, 'code', 'VOTE_REQUIRED');
  end if;

  select * into existing from public.sidequest_submissions
  where quest_id = q.id and user_id = p_user
  for update;

  begin
    if not found then
      insert into public.sidequest_submissions
        (quest_id, user_id, status, points_awarded, submitted_at, reviewed_at, source, proof_path,
         proof_sha256, handle, vote_team_id, review_state, attempts)
      values
        (q.id, p_user, 'approved', q.points, now(), now(), 'proof', p_path, p_sha256, v_handle,
         p_vote_team, 'unreviewed', 1);
      return jsonb_build_object('ok', true, 'code', 'AWARDED', 'points', q.points);
    end if;

    if existing.status in ('approved', 'pending') then
      return jsonb_build_object('ok', false, 'code', 'ALREADY');
    end if;
    if existing.attempts >= 2 then
      return jsonb_build_object('ok', false, 'code', 'NO_MORE_ATTEMPTS');
    end if;

    update public.sidequest_submissions
    set status = 'pending', points_awarded = 0, submitted_at = now(), reviewed_at = null,
        reviewed_by = null, review_note = null, source = 'proof', proof_path = p_path,
        proof_sha256 = p_sha256, handle = v_handle, vote_team_id = p_vote_team,
        review_state = 'unreviewed', attempts = existing.attempts + 1
    where id = existing.id;
    return jsonb_build_object('ok', true, 'code', 'PENDING');
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'HANDLE_USED');
  end;
end;
$$;

revoke execute on function public.arcade_submit_proof(uuid, text, text, text, text, uuid, text[]) from public, anon, authenticated;
grant execute on function public.arcade_submit_proof(uuid, text, text, text, text, uuid, text[]) to service_role;

-- Review: 'verify' keeps (or, for a pending re-upload, grants) the points; 'void' removes them.
-- Only an unreviewed proof can be decided. { ok, code }: DONE, NOT_FOUND (decided already / none).
create or replace function public.arcade_review_proof(p_submission uuid, p_decision text, p_reviewer uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_points integer;
begin
  if p_decision not in ('verify', 'void') then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DECISION');
  end if;

  select q.points into v_points
  from public.sidequest_submissions sub
  join public.sidequests q on q.id = sub.quest_id
  where sub.id = p_submission and sub.source = 'proof' and sub.review_state = 'unreviewed'
  for update of sub;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  if p_decision = 'verify' then
    update public.sidequest_submissions
    set status = 'approved',
        points_awarded = case when status = 'approved' then points_awarded else v_points end,
        review_state = 'verified', reviewed_by = p_reviewer, reviewed_at = now()
    where id = p_submission;
  else
    update public.sidequest_submissions
    set status = 'rejected', points_awarded = 0, review_state = 'voided',
        reviewed_by = p_reviewer, reviewed_at = now()
    where id = p_submission;
  end if;
  return jsonb_build_object('ok', true, 'code', 'DONE');
end;
$$;

revoke execute on function public.arcade_review_proof(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.arcade_review_proof(uuid, text, uuid) to service_role;

-- Prize handover at the desk. Sticker (101): a counted booth visit, an automatic quest other than
-- the gate, or a verified proof. Mug (102) / Keychain (103): from published results (wave 3).
-- { ok, code }: CLAIMED, or ALREADY_CLAIMED, OUT_OF_STOCK, NOT_ELIGIBLE, NOT_PUBLISHED,
-- COMMITTEE_ACCOUNT, SELF_CLAIM, TIER_NOT_FOUND, PAUSED, CLOSED.
create or replace function public.arcade_claim_prize(
  p_user uuid,
  p_tier_number integer,
  p_staff uuid,
  p_admin_emails text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.arcade_settings;
  t record;
  v_claimed integer;
  v_eligible boolean;
begin
  select * into s from public.arcade_settings where id = 1;
  if s.paused_at is not null then return jsonb_build_object('ok', false, 'code', 'PAUSED'); end if;
  if now() < s.opens_at or now() > s.claims_close_at then
    return jsonb_build_object('ok', false, 'code', 'CLOSED');
  end if;
  if p_user = p_staff then return jsonb_build_object('ok', false, 'code', 'SELF_CLAIM'); end if;
  if public.arcade_is_committee(p_user, p_admin_emails) then
    return jsonb_build_object('ok', false, 'code', 'COMMITTEE_ACCOUNT');
  end if;

  select id, tier_number, total_stock into t
  from public.reward_tiers
  where tier_number = p_tier_number and is_active
  for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'TIER_NOT_FOUND'); end if;

  if exists (select 1 from public.reward_claims c where c.tier_id = t.id and c.user_id = p_user) then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_CLAIMED');
  end if;

  if t.tier_number = 101 then
    v_eligible :=
      exists (
        select 1 from public.booth_scan_events e
        where e.user_id = p_user and e.kind = 'visit' and e.captured_at between s.opens_at and s.freezes_at
      )
      or exists (
        select 1 from public.sidequest_submissions q
        where q.user_id = p_user and q.status = 'approved'
          and q.submitted_at between s.opens_at and s.freezes_at
          and (q.source in ('feedback', 'referral') or (q.source = 'proof' and q.review_state = 'verified'))
      );
  else
    if s.results_published_at is null then
      return jsonb_build_object('ok', false, 'code', 'NOT_PUBLISHED');
    end if;
    -- Wave 3 fills arcade_results; until then nobody is eligible for a rank prize.
    v_eligible := false;
  end if;
  if not v_eligible then return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE'); end if;

  select count(*) into v_claimed from public.reward_claims c where c.tier_id = t.id;
  if t.total_stock is not null and v_claimed >= t.total_stock then
    return jsonb_build_object('ok', false, 'code', 'OUT_OF_STOCK');
  end if;

  insert into public.reward_claims (tier_id, user_id, points_at_claim, claimed_by)
  values (t.id, p_user, 0, p_staff);
  return jsonb_build_object('ok', true, 'code', 'CLAIMED', 'remaining',
    case when t.total_stock is null then null else t.total_stock - v_claimed - 1 end);
end;
$$;

revoke execute on function public.arcade_claim_prize(uuid, integer, uuid, text[]) from public, anon, authenticated;
grant execute on function public.arcade_claim_prize(uuid, integer, uuid, text[]) to service_role;

notify pgrst, 'reload schema';
