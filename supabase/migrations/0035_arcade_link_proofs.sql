-- Insight Arcade: link proofs for social quests.
--
-- 1. sidequests.proof_kind: 'photo' (upload a photo, as before) or 'link' (send a link). The story
--    and Add Yours quests become link quests; the follow quests (screenshot + username), drone
--    soccer and merch stay photo quests.
-- 2. sidequest_submissions.proof_url (from 0021) holds the link (https, normalized by
--    src/lib/proof-link.ts).
-- 3. Quest texts and links match the official accounts in src/shared/constants/social.ts
--    (Instagram @itbinsight, X @itbinsight, TikTok @itb_insight); src/lib/proof-link.test.ts
--    checks this file against that constant.
-- 4. arcade_submit_proof() takes p_url and checks the proof matches the quest's proof_kind
--    (new refusal code PROOF_REQUIRED). Same rules otherwise: points at once on the first
--    proof, review first after a void, two attempts.

-- 1. + 2. Columns --------------------------------------------------------------------------------
alter table public.sidequests
  add column if not exists proof_kind text not null default 'photo';

alter table public.sidequests
  drop constraint if exists sidequests_proof_kind_check;

alter table public.sidequests
  add constraint sidequests_proof_kind_check check (proof_kind in ('photo', 'link'));

-- proof_url already exists (0021, <= 1000 chars) and the older side-quest API writes it too, so no
-- new constraint here: arcade_submit_proof() below enforces https and <= 300 chars for arcade links.
alter table public.sidequest_submissions
  add column if not exists proof_url text;

-- 3. Quests --------------------------------------------------------------------------------------
update public.sidequests as q
set title = v.title,
    description = v.description,
    shortcut_url = v.shortcut_url,
    proof_kind = v.proof_kind
from (values
  ('arcade-follow-ig', 'Follow IG @itbinsight',
   'Follow Instagram @itbinsight, lalu unggah screenshot profil @itbinsight yang menunjukkan kamu sudah follow, dan isi username Instagram-mu.',
   'https://www.instagram.com/itbinsight/', 'photo'),
  ('arcade-follow-tiktok-x', 'Follow TikTok @itb_insight atau X @itbinsight',
   'Follow TikTok @itb_insight atau X @itbinsight, lalu unggah screenshot profilnya yang menunjukkan kamu sudah follow, dan isi username TikTok atau X-mu.',
   'https://www.tiktok.com/@itb_insight', 'photo'),
  ('arcade-share-poster-story', 'Share Poster ITB INSIGHT 2026 ke Story',
   'Bagikan poster ITB INSIGHT 2026 dari Instagram @itbinsight ke Story-mu, lalu kirim link story-nya.',
   'https://www.instagram.com/itbinsight/', 'link'),
  ('arcade-add-yours-dday', 'Up Moment Keseruan D-Day pakai Add Yours',
   'Unggah momen keseruanmu di ITB INSIGHT 2026 pakai stiker Add Yours dan tag @itbinsight, lalu kirim link story-nya.',
   'https://www.instagram.com/itbinsight/', 'link'),
  ('arcade-foto-kyubi', 'Foto dengan Kyubi + Add Yours',
   'Berfoto dengan Kyubi, maskot ITB Insight, bagikan pakai Add Yours dan tag @itbinsight, lalu kirim link story-nya.',
   'https://www.instagram.com/itbinsight/', 'link'),
  ('arcade-add-yours-play-tech', 'Add Yours di Booth Play-Tech',
   'Unggah momen dan kesanmu di Play-Tech pakai Add Yours dan tag @itbinsight, lalu kirim link story-nya.',
   'https://www.instagram.com/itbinsight/', 'link'),
  ('arcade-add-yours-show-tech', 'Add Yours di Booth Show-Tech',
   'Unggah momen dan kesanmu di Show-Tech pakai Add Yours dan tag @itbinsight, lalu kirim link story-nya.',
   'https://www.instagram.com/itbinsight/', 'link'),
  ('arcade-add-yours-tech-xhibition', 'Add Yours di Tech-Xhibition',
   'Unggah momen dan kesanmu di Tech-Xhibition pakai Add Yours dan tag @itbinsight, lalu kirim link story-nya.',
   'https://www.instagram.com/itbinsight/', 'link'),
  ('arcade-add-yours-seminar', 'Add Yours di Seminar Technology',
   'Unggah momen dan kesanmu selama talkshow Seminar Technology pakai Add Yours dan tag @itbinsight, lalu kirim link story-nya.',
   'https://www.instagram.com/itbinsight/', 'link')
) as v(slug, title, description, shortcut_url, proof_kind)
where q.slug = v.slug;

-- 4. Submit --------------------------------------------------------------------------------------
drop function if exists public.arcade_submit_proof(uuid, text, text, text, text, uuid, text[]);

-- { ok, code }: AWARDED (instant points), PENDING (re-submission after a void: reviewed first), or
-- a refusal: PAUSED, NOT_OPEN, CLOSED, COMMITTEE_ACCOUNT, QUEST_NOT_FOUND, PROOF_REQUIRED, ALREADY,
-- NO_MORE_ATTEMPTS, HANDLE_REQUIRED, HANDLE_INVALID, VOTE_REQUIRED, HANDLE_USED.
-- Photo quests take p_path (+ p_sha256 of the upload); link quests take p_url (+ p_sha256 of the
-- normalized link, so the same link sent from two accounts is flagged to reviewers).
create or replace function public.arcade_submit_proof(
  p_user uuid,
  p_slug text,
  p_path text default null,
  p_sha256 text default null,
  p_handle text default null,
  p_vote_team uuid default null,
  p_admin_emails text[] default '{}',
  p_url text default null
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
  v_path text;
  v_url text;
begin
  select * into s from public.arcade_settings where id = 1;
  if s.paused_at is not null then return jsonb_build_object('ok', false, 'code', 'PAUSED'); end if;
  if now() < s.opens_at then return jsonb_build_object('ok', false, 'code', 'NOT_OPEN'); end if;
  if now() > s.freezes_at then return jsonb_build_object('ok', false, 'code', 'CLOSED'); end if;
  if public.arcade_is_committee(p_user, p_admin_emails) then
    return jsonb_build_object('ok', false, 'code', 'COMMITTEE_ACCOUNT');
  end if;

  select id, points, needs_handle, needs_vote, proof_kind into q
  from public.sidequests
  where slug = p_slug and verify = 'proof' and is_active;
  if not found then return jsonb_build_object('ok', false, 'code', 'QUEST_NOT_FOUND'); end if;

  if q.proof_kind = 'link' then
    v_url := nullif(btrim(coalesce(p_url, '')), '');
    if v_url is null or v_url !~ '^https://' or char_length(v_url) > 300 then
      return jsonb_build_object('ok', false, 'code', 'PROOF_REQUIRED');
    end if;
  else
    v_path := nullif(btrim(coalesce(p_path, '')), '');
    if v_path is null then return jsonb_build_object('ok', false, 'code', 'PROOF_REQUIRED'); end if;
  end if;

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
         proof_url, proof_sha256, handle, vote_team_id, review_state, attempts)
      values
        (q.id, p_user, 'approved', q.points, now(), now(), 'proof', v_path, v_url, p_sha256, v_handle,
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
        reviewed_by = null, review_note = null, source = 'proof', proof_path = v_path,
        proof_url = v_url, proof_sha256 = p_sha256, handle = v_handle, vote_team_id = p_vote_team,
        review_state = 'unreviewed', attempts = existing.attempts + 1
    where id = existing.id;
    return jsonb_build_object('ok', true, 'code', 'PENDING');
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'HANDLE_USED');
  end;
end;
$$;

revoke execute on function public.arcade_submit_proof(uuid, text, text, text, text, uuid, text[], text) from public, anon, authenticated;
grant execute on function public.arcade_submit_proof(uuid, text, text, text, text, uuid, text[], text) to service_role;
