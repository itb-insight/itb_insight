-- Insight Arcade: committee / staff accounts may play, to test the game on D-day.
--
-- Before: arcade_award_booth, arcade_award_auto and arcade_submit_proof refused committee accounts
-- (COMMITTEE_ACCOUNT). Now they award them like anyone else. What stays the same:
--   - arcade_leaderboard() still leaves them out of the ranking, so they are never on the board,
--     never in arcade_publish_results() and so never win Mug / Keychain;
--   - arcade_claim_prize() still refuses them (no Sticker, Mug or Keychain);
--   - a scanner still cannot award points to themself (SELF_AWARD).
-- arcade_leaderboard() now also returns `staff`: [{ userId, points }] so a committee account can
-- see its own total on /arcade (read by the server only, never rendered on the board).
-- The functions below are 0030 / 0031 / 0035 with the committee check removed.

-- Booth award (0030) ------------------------------------------------------------------------------
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

-- Automatic quests: gate, feedback, referral (0031) ------------------------------------------------
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

-- Proof submissions (0035) -------------------------------------------------------------------------
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

-- Leaderboard (0031): committee still unranked, their totals returned separately -----------------
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
  all_totals as (
    select r.user_id, sum(r.points)::integer as points, max(r.at) as last_at, min(r.at) as first_at,
           exists (select 1 from committee c where c.user_id = r.user_id) as is_committee
    from all_rows r
    group by r.user_id
    having sum(r.points) > 0
  ),
  -- Committee / staff play to test the game but are never ranked (so never in results or prizes).
  totals as (
    select t.user_id, t.points, t.last_at, t.first_at from all_totals t where not t.is_committee
  ),
  ranked as (
    select t.*, row_number() over (order by t.points desc, t.last_at, t.first_at, t.user_id) as rank
    from totals t
  )
  select jsonb_build_object(
    'players', (select count(*) from ranked),
    -- Their own totals, for their own hub only; never shown on the board.
    'staff', coalesce((
      select jsonb_agg(jsonb_build_object('userId', t.user_id, 'points', t.points))
      from all_totals t
      where t.is_committee
    ), '[]'::jsonb),
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
