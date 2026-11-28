-- Insight Arcade: offline scan queue (PWA). Staff phones store booth awards and gate check-ins
-- while the signal is gone and send them, with the time they were captured, once it is back.
--
-- 1. arcade_award_booth (0036): no 15-minute limit (TOO_OLD) on the capture time any more. A queued
--    award counts when it was captured inside the game window (opens_at .. freezes_at) and reaches
--    the server before freezes_at + sync_grace_minutes. A replayed client_ref now answers DUPLICATE
--    before the pause and window checks.
-- 2. arcade_award_auto (0036): a capture time given by the caller (gate queue) follows the same
--    freeze + grace rule.
-- 3. sync_grace_minutes: default and current value raised to at least 60 minutes.

alter table public.arcade_settings alter column sync_grace_minutes set default 60;
update public.arcade_settings set sync_grace_minutes = greatest(sync_grace_minutes, 60) where id = 1;

-- 1. Booth award ---------------------------------------------------------------------------------
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

  -- A replay of an award already written (offline queue resend, retry after a lost response):
  -- answer DUPLICATE before the pause and window checks, so a resend after the freeze or during a
  -- pause is not reported as a failure. The check under the lock below stays for concurrent sends.
  if p_client_ref is not null and exists (
    select 1 from public.booth_scan_events e where e.client_ref = p_client_ref
  ) then
    select
      coalesce(bool_or(e.kind = 'visit'), false),
      coalesce(bool_or(e.bonus_points > 0), false)
    into v_visit, v_bonus
    from public.booth_scan_events e
    where e.user_id = p_user and e.booth_id = p_booth;
    return jsonb_build_object(
      'ok', true, 'code', 'DUPLICATE', 'contribution', 0, 'bonus', 0, 'total', 0,
      'given', jsonb_build_object('contribution', v_visit, 'bonus', v_bonus)
    );
  end if;

  if s.paused_at is not null then
    return jsonb_build_object('ok', false, 'code', 'PAUSED');
  end if;

  -- The award time: the client's capture time (offline queue), never in the future. Any capture
  -- inside the game window counts, as long as it reaches the server before freeze + grace.
  v_captured := least(coalesce(p_captured_at, v_now), v_now);
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

revoke execute on function public.arcade_award_booth(uuid, uuid, text, uuid, uuid, timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.arcade_award_booth(uuid, uuid, text, uuid, uuid, timestamptz, text[]) to service_role;

-- 2. Automatic quests (gate, feedback, referral) ------------------------------------------------
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
  -- A capture time from an offline queue (gate) must still reach the server before freeze + grace.
  if v_at > s.freezes_at
     or (p_at is not null and now() > s.freezes_at + make_interval(mins => s.sync_grace_minutes)) then
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
