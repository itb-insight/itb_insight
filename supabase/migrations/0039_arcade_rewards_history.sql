-- Insight Arcade: the player's Rewards and Points History pages, and live prize stock at the desk.
-- Points are never spent: they only rank players. Prizes are handed out at the prize desk
-- (Booth Entrepreneur), one per prize per person.
--
-- 1. arcade_sticker_eligible(p_user): the Sticker rule (a counted booth visit, or an approved
--    automatic quest / verified proof), now shared by arcade_claim_prize and the Rewards page.
-- 2. arcade_claim_prize(): 0033 with the Sticker rule read from (1). Nothing else changes.
-- 3. arcade_player_prizes(p_user, p_admin_emails): every prize (101-103) with its stock left and
--    what this player can do about it, for /arcade/rewards.
-- 4. arcade_player_history(p_user): every change to the player's points, for /arcade/history.
--    The rows are the leaderboard's own (arcade_leaderboard, 0036), so the counted rows add up to
--    the total on the board. A first proof upload pays at once; a void takes it away again, so a
--    voided first upload shows as +points then -points.
-- 5. arcade_adjust_prize_stock(p_tier_number, p_delta, p_left): the prize desk adjusts the supply
--    left (by a step, or set to a counted number). The stock left is total_stock minus the claims,
--    so every handout lowers it on its own. Locks the tier row like arcade_claim_prize does.

-- 1. Sticker rule --------------------------------------------------------------------------------
create or replace function public.arcade_sticker_eligible(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.booth_scan_events e
      cross join public.arcade_settings s
      where s.id = 1 and e.user_id = p_user and e.kind = 'visit'
        and e.captured_at between s.opens_at and s.freezes_at
    )
    or exists (
      select 1
      from public.sidequest_submissions q
      cross join public.arcade_settings s
      where s.id = 1 and q.user_id = p_user and q.status = 'approved'
        and q.submitted_at between s.opens_at and s.freezes_at
        and (q.source in ('feedback', 'referral') or (q.source = 'proof' and q.review_state = 'verified'))
    );
$$;

revoke execute on function public.arcade_sticker_eligible(uuid) from public, anon, authenticated;
grant execute on function public.arcade_sticker_eligible(uuid) to service_role;

-- 2. Prize handover (0033, Sticker rule from (1)) ------------------------------------------------
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
  v_rank integer;
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
    v_eligible := public.arcade_sticker_eligible(p_user);
  else
    if s.results_published_at is null then
      return jsonb_build_object('ok', false, 'code', 'NOT_PUBLISHED');
    end if;
    select r.rank into v_rank
    from public.arcade_results r
    where r.user_id = p_user and r.version = (select max(version) from public.arcade_results);
    v_eligible := v_rank is not null and (
      (t.tier_number = 102 and v_rank between 1 and 5)
      or (t.tier_number = 103 and v_rank between 6 and 10)
    );
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

-- 3. The player's prizes -------------------------------------------------------------------------
-- { committee, published, resultRank, prizes: [{ tier, name, note, left, claimedAt, eligible }] }
-- left: null = no limit. eligible: may collect it now (Mug / Keychain only after publication).
create or replace function public.arcade_player_prizes(p_user uuid, p_admin_emails text[] default '{}')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.arcade_settings;
  v_rank integer;
  v_sticker boolean;
begin
  select * into s from public.arcade_settings where id = 1;
  if s.results_published_at is not null then
    select r.rank into v_rank
    from public.arcade_results r
    where r.user_id = p_user and r.version = (select max(version) from public.arcade_results);
  end if;
  v_sticker := public.arcade_sticker_eligible(p_user);

  return jsonb_build_object(
    'committee', public.arcade_is_committee(p_user, p_admin_emails),
    'published', s.results_published_at is not null,
    'resultRank', v_rank,
    'prizes', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'tier', t.tier_number,
          'name', t.reward_name,
          'note', t.note,
          'left', case when t.total_stock is null then null
                       else greatest(0, t.total_stock - (select count(*) from public.reward_claims c where c.tier_id = t.id)) end,
          'claimedAt', (select c.claimed_at from public.reward_claims c where c.tier_id = t.id and c.user_id = p_user),
          'eligible', case t.tier_number
                        when 101 then v_sticker
                        when 102 then coalesce(v_rank between 1 and 5, false)
                        when 103 then coalesce(v_rank between 6 and 10, false)
                        else false end
        )
        order by t.tier_number
      )
      from public.reward_tiers t
      where t.tier_number between 101 and 103 and t.is_active
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.arcade_player_prizes(uuid, text[]) from public, anon, authenticated;
grant execute on function public.arcade_player_prizes(uuid, text[]) to service_role;

-- 4. The player's points history -----------------------------------------------------------------
-- [{ at, kind, title, category, points, status }], newest first.
--   kind:   visit | bonus | manual | quest | collection
--   status: earned (counted) | review (counted, proof not checked yet) | pending (not counted until
--           a reviewer approves it) | voided (points taken away, or a re-upload rejected) |
--           manual (help-desk correction, may be negative)
create or replace function public.arcade_player_history(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select opens_at, freezes_at, results_published_at from public.arcade_settings where id = 1
  ),
  booth_rows as (
    select e.booth_id, e.kind, e.points_awarded as points,
           case when e.kind = 'manual' then e.scanned_at else e.captured_at end as at
    from public.booth_scan_events e
    cross join s
    where e.user_id = p_user
      and ((e.kind <> 'manual' and e.captured_at between s.opens_at and s.freezes_at)
        or (e.kind = 'manual' and e.scanned_at >= s.opens_at
            and (s.results_published_at is null or e.scanned_at <= s.results_published_at)))
  ),
  visits as (
    select b.booth_id, bo.category, b.at
    from booth_rows b
    join public.booths bo on bo.id = b.booth_id
    where b.kind = 'visit'
  ),
  collection_hits as (
    select c.id as collection_id, c.title, c.rule, c.bonus, c.min_total, c.min_per_category,
           cardinality(c.categories) as n_categories,
           v.category, v.at,
           row_number() over (partition by c.id order by v.at, v.booth_id) as n_total,
           row_number() over (partition by c.id, v.category order by v.at, v.booth_id) as n_cat
    from public.arcade_collections c
    join visits v on v.category = any (c.categories)
    where c.is_active
  ),
  entries as (
    select b.at,
           b.kind,
           case when b.kind = 'manual' then 'Koreksi poin oleh panitia' else bo.name end as title,
           bo.category,
           b.points,
           case when b.kind = 'manual' then 'manual' else 'earned' end as status
    from booth_rows b
    left join public.booths bo on bo.id = b.booth_id

    union all
    -- Approved quests (counted). A re-upload approved by a reviewer paid at review time.
    select case when q.attempts > 1 and q.reviewed_at is not null then q.reviewed_at else q.submitted_at end,
           'quest', sq.title, null, q.points_awarded,
           case when q.source = 'proof' and q.review_state = 'unreviewed' then 'review' else 'earned' end
    from public.sidequest_submissions q
    join public.sidequests sq on sq.id = q.quest_id
    cross join s
    where q.user_id = p_user and q.status = 'approved'
      and q.submitted_at between s.opens_at and s.freezes_at

    union all
    -- Re-uploads waiting for a reviewer: not counted yet.
    select q.submitted_at, 'quest', sq.title, null, sq.points, 'pending'
    from public.sidequest_submissions q
    join public.sidequests sq on sq.id = q.quest_id
    cross join s
    where q.user_id = p_user and q.status = 'pending'
      and q.submitted_at between s.opens_at and s.freezes_at

    union all
    -- A voided first upload: it paid when uploaded...
    select q.submitted_at, 'quest', sq.title, null, sq.points, 'earned'
    from public.sidequest_submissions q
    join public.sidequests sq on sq.id = q.quest_id
    cross join s
    where q.user_id = p_user and q.source = 'proof' and q.review_state = 'voided' and q.attempts = 1
      and q.submitted_at between s.opens_at and s.freezes_at

    union all
    -- ...and the void took it back. A rejected re-upload never paid, so it shows 0.
    select coalesce(q.reviewed_at, q.submitted_at), 'quest', sq.title, null,
           case when q.attempts = 1 then -sq.points else 0 end, 'voided'
    from public.sidequest_submissions q
    join public.sidequests sq on sq.id = q.quest_id
    cross join s
    where q.user_id = p_user and q.source = 'proof' and q.review_state = 'voided'
      and q.submitted_at between s.opens_at and s.freezes_at

    union all
    select h.at, 'collection', h.title, null, h.bonus, 'earned'
    from collection_hits h
    where h.rule = 'count_in' and h.n_total = h.min_total

    union all
    select max(h.at), 'collection', max(h.title), null, max(h.bonus), 'earned'
    from collection_hits h
    where h.rule = 'each_of' and h.n_cat = h.min_per_category
    group by h.collection_id
    having count(distinct h.category) = max(h.n_categories)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'at', e.at,
        'kind', e.kind,
        'title', e.title,
        'category', e.category,
        'points', e.points,
        'status', e.status
      )
      order by e.at desc, e.status
    ),
    '[]'::jsonb
  )
  from entries e;
$$;

revoke execute on function public.arcade_player_history(uuid) from public, anon, authenticated;
grant execute on function public.arcade_player_history(uuid) to service_role;

-- 5. Prize stock at the desk ---------------------------------------------------------------------
-- Exactly one of p_delta (add / remove that many) or p_left (set the number left).
-- { ok, code }: ADJUSTED with { claimed, leftBefore, left }, or INVALID, TIER_NOT_FOUND,
-- BELOW_ZERO (fewer than 0 left), TOO_MANY (more than 100000 in total).
create or replace function public.arcade_adjust_prize_stock(
  p_tier_number integer,
  p_delta integer default null,
  p_left integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  t record;
  v_claimed integer;
  v_before integer;
  v_left integer;
begin
  if (p_delta is null) = (p_left is null) then
    return jsonb_build_object('ok', false, 'code', 'INVALID');
  end if;

  select id, total_stock into t
  from public.reward_tiers
  where tier_number = p_tier_number and tier_number between 101 and 103 and is_active
  for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'TIER_NOT_FOUND'); end if;

  select count(*) into v_claimed from public.reward_claims c where c.tier_id = t.id;
  v_before := greatest(0, coalesce(t.total_stock, v_claimed) - v_claimed);
  v_left := coalesce(p_left, v_before + p_delta);

  if v_left < 0 then
    return jsonb_build_object('ok', false, 'code', 'BELOW_ZERO', 'left', v_before);
  end if;
  if v_claimed + v_left > 100000 then
    return jsonb_build_object('ok', false, 'code', 'TOO_MANY', 'left', v_before);
  end if;

  update public.reward_tiers set total_stock = v_claimed + v_left where id = t.id;
  return jsonb_build_object('ok', true, 'code', 'ADJUSTED', 'claimed', v_claimed, 'leftBefore', v_before, 'left', v_left);
end;
$$;

revoke execute on function public.arcade_adjust_prize_stock(integer, integer, integer) from public, anon, authenticated;
grant execute on function public.arcade_adjust_prize_stock(integer, integer, integer) to service_role;

notify pgrst, 'reload schema';
