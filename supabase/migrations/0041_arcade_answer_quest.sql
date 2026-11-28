-- Insight Arcade: answer quests (type the answer to a question) and the first one, "Tebak Hewan".
--
-- 1. sidequests.proof_kind gains 'answer': the player types a short answer instead of sending a
--    photo or a link.
-- 2. arcade_quest_answers: the accepted answers per quest. sidequests is readable by anon, so the
--    answers live in their own table that only the service role can read.
-- 3. arcade_submit_answer(): checks the answer (case-insensitive, extra spaces ignored). A right
--    answer is awarded at once and stored as verified (the check is the review, so it never sits in
--    the reviewers' queue). A wrong answer stores nothing and costs no attempt; the proof API's
--    rate limit (6 per minute) is the brake on guessing.
-- 4. The quest: "Ada hewan apa di landing page itbinsight.com?". The answer sits in the sponsor
--    section at the bottom of the landing page, so the quest sends players past the sponsors.

-- 1. Proof kind ----------------------------------------------------------------------------------
alter table public.sidequests
  drop constraint if exists sidequests_proof_kind_check;

alter table public.sidequests
  add constraint sidequests_proof_kind_check check (proof_kind in ('photo', 'link', 'answer'));

-- 2. Answers -------------------------------------------------------------------------------------
create table if not exists public.arcade_quest_answers (
  quest_id uuid primary key references public.sidequests(id) on delete cascade,
  -- Stored normalized: lowercase, single spaces, no leading / trailing spaces.
  answers text[] not null check (cardinality(answers) >= 1)
);

alter table public.arcade_quest_answers enable row level security;
revoke all on public.arcade_quest_answers from anon, authenticated;
grant select, insert, update, delete on public.arcade_quest_answers to service_role;

-- 3. Submit --------------------------------------------------------------------------------------
-- { ok, code }: AWARDED (+ points) or a refusal: PAUSED, NOT_OPEN, CLOSED, QUEST_NOT_FOUND,
-- PROOF_REQUIRED (empty answer), WRONG_ANSWER, ALREADY.
create or replace function public.arcade_submit_answer(
  p_user uuid,
  p_slug text,
  p_answer text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.arcade_settings;
  q record;
  v_answer text := lower(btrim(regexp_replace(coalesce(p_answer, ''), '\s+', ' ', 'g')));
  v_id uuid;
begin
  select * into s from public.arcade_settings where id = 1;
  if s.paused_at is not null then return jsonb_build_object('ok', false, 'code', 'PAUSED'); end if;
  if now() < s.opens_at then return jsonb_build_object('ok', false, 'code', 'NOT_OPEN'); end if;
  if now() > s.freezes_at then return jsonb_build_object('ok', false, 'code', 'CLOSED'); end if;

  select sq.id, sq.points, a.answers into q
  from public.sidequests sq
  join public.arcade_quest_answers a on a.quest_id = sq.id
  where sq.slug = p_slug and sq.verify = 'proof' and sq.proof_kind = 'answer' and sq.is_active;
  if not found then return jsonb_build_object('ok', false, 'code', 'QUEST_NOT_FOUND'); end if;

  if v_answer = '' or char_length(v_answer) > 60 then
    return jsonb_build_object('ok', false, 'code', 'PROOF_REQUIRED');
  end if;

  if exists (select 1 from public.sidequest_submissions where quest_id = q.id and user_id = p_user) then
    return jsonb_build_object('ok', false, 'code', 'ALREADY');
  end if;

  if not (v_answer = any (q.answers)) then
    return jsonb_build_object('ok', false, 'code', 'WRONG_ANSWER');
  end if;

  insert into public.sidequest_submissions
    (quest_id, user_id, status, points_awarded, submitted_at, reviewed_at, source, note,
     review_state, attempts)
  values
    (q.id, p_user, 'approved', q.points, now(), now(), 'proof', v_answer, 'verified', 1)
  on conflict (quest_id, user_id) do nothing
  returning id into v_id;

  if v_id is null then return jsonb_build_object('ok', false, 'code', 'ALREADY'); end if;
  return jsonb_build_object('ok', true, 'code', 'AWARDED', 'points', q.points);
end;
$$;

revoke execute on function public.arcade_submit_answer(uuid, text, text) from public, anon, authenticated;
grant execute on function public.arcade_submit_answer(uuid, text, text) to service_role;

-- 4. The quest -----------------------------------------------------------------------------------
insert into public.sidequests
  (slug, category, title, description, pic, points, shortcut_url, requires_proof, target_count,
   order_index, verify, area, needs_handle, needs_vote, proof_kind, is_active)
values
  ('arcade-tebak-hewan', 'marketing', 'Tebak Hewan di itbinsight.com',
   'Ada hewan apa di landing page itbinsight.com? Petunjuk: scroll ke bagian paling bawah.',
   'SP', 5, '/', false, 1, 15, 'proof', null, null, false, 'answer', true)
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
      proof_kind = excluded.proof_kind,
      is_active = excluded.is_active;

insert into public.arcade_quest_answers (quest_id, answers)
select id, array['gajah', 'elephant', 'roga']
from public.sidequests
where slug = 'arcade-tebak-hewan'
on conflict (quest_id) do update set answers = excluded.answers;
