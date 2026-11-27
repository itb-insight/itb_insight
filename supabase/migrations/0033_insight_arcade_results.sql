-- Insight Arcade, wave 3: final results and rank prizes.
--
-- 1. arcade_results: snapshot of the board at publication (top 50), versioned. The latest version
--    is the result; Mug (rank 1-5) and Keychain (rank 6-10) are handed out from it only, so later
--    corrections never move a prize silently.
-- 2. arcade_publish_results(): after the freeze, writes a new version and stamps
--    arcade_settings.results_published_at. Refused while any proof of the current top 15 is still
--    unreviewed (p_force overrides), and once a rank prize has been handed out (the result is then
--    final). p_disqualify: players left out of this version.
-- 3. arcade_claim_prize(): Mug / Keychain read the latest snapshot.

create table if not exists public.arcade_results (
  version integer not null,
  rank integer not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  last_at timestamptz,
  published_at timestamptz not null default now(),
  published_by uuid references public.profiles(id) on delete set null,
  primary key (version, rank),
  unique (version, user_id)
);

alter table public.arcade_results enable row level security;
revoke all on public.arcade_results from anon, authenticated;
grant select, insert on public.arcade_results to service_role;

create or replace function public.arcade_publish_results(
  p_by uuid,
  p_admin_emails text[] default '{}',
  p_disqualify uuid[] default '{}',
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.arcade_settings;
  v_board jsonb;
  v_pending integer;
  v_version integer;
begin
  select * into s from public.arcade_settings where id = 1 for update;
  if now() <= s.freezes_at then
    return jsonb_build_object('ok', false, 'code', 'NOT_FROZEN');
  end if;
  if exists (
    select 1 from public.reward_claims c join public.reward_tiers t on t.id = c.tier_id
    where t.tier_number in (102, 103)
  ) then
    return jsonb_build_object('ok', false, 'code', 'PRIZES_HANDED');
  end if;

  v_board := public.arcade_leaderboard(p_admin_emails);

  select count(*) into v_pending
  from public.sidequest_submissions q
  where q.source = 'proof' and q.review_state = 'unreviewed'
    and q.user_id in (
      select (e->>'userId')::uuid
      from jsonb_array_elements(v_board->'entries') e
      where (e->>'userId')::uuid <> all (coalesce(p_disqualify, '{}'::uuid[]))
      limit 15
    );
  if v_pending > 0 and not p_force then
    return jsonb_build_object('ok', false, 'code', 'PENDING_REVIEWS', 'pending', v_pending);
  end if;

  select coalesce(max(version), 0) + 1 into v_version from public.arcade_results;

  insert into public.arcade_results (version, rank, user_id, points, last_at, published_by)
  select v_version, row_number() over (order by (e->>'rank')::integer), (e->>'userId')::uuid,
         (e->>'points')::integer, (e->>'lastAt')::timestamptz, p_by
  from jsonb_array_elements(v_board->'entries') e
  where (e->>'userId')::uuid <> all (coalesce(p_disqualify, '{}'::uuid[]))
  order by (e->>'rank')::integer
  limit 50;

  update public.arcade_settings
  set results_published_at = now(), results_published_by = p_by
  where id = 1;

  return jsonb_build_object('ok', true, 'code', 'PUBLISHED', 'version', v_version, 'pending', v_pending);
end;
$$;

revoke execute on function public.arcade_publish_results(uuid, text[], uuid[], boolean) from public, anon, authenticated;
grant execute on function public.arcade_publish_results(uuid, text[], uuid[], boolean) to service_role;

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

notify pgrst, 'reload schema';
