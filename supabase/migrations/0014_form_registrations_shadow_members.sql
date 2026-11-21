-- 0014: competition teams registered off-site (Google Form) and "shadow" team members.
--
-- Registration for some competitions ran on Google Forms; those teams are imported by
-- scripts/import-oe-registrations.ts and the site only shows them. A person on an imported team
-- who has no account yet gets a shadow slot: a competition_team_members row with user_id NULL and
-- a claim_email. When someone signs in with that email (verified), claimPendingSlots()
-- (src/lib/competition-claims.ts) fills in user_id and the slot becomes theirs. Form members have
-- no email, so their slots start with claim_email NULL until the leader invites an email.

-- 1. Olimpiade Engineering is a team competition of exactly 3 (src/lib/competitions.ts).
insert into public.competitions (slug, name, category, registration_type, team_uid_prefix, team_min, team_max, is_active)
values ('olimpiade-engineering', 'Olimpiade Engineering', 'olimpiade', 'team', 'OE', 3, 3, true)
on conflict (slug) do update
  set registration_type = 'team',
      team_uid_prefix = 'OE',
      team_min = 3,
      team_max = 3;

-- 2. Teams: a shadow leader has no user yet, teams can withdraw, and we record where a team came
--    from. Team names are not unique on the form (two schools can pick the same name, and teams
--    cannot rename), so uniqueness only applies to teams created on the site.
alter table public.competition_teams
  alter column leader_user_id drop not null,
  add column if not exists source text not null default 'web',
  add column if not exists withdrawn_at timestamptz;

alter table public.competition_teams
  drop constraint if exists competition_teams_status_check,
  drop constraint if exists competition_teams_source_check,
  drop constraint if exists competition_teams_competition_id_team_name_key;

alter table public.competition_teams
  add constraint competition_teams_status_check
    check (status in ('draft', 'submitted', 'verified', 'rejected', 'withdrawn')),
  add constraint competition_teams_source_check
    check (source in ('web', 'form_import', 'test'));

create unique index if not exists competition_teams_web_name_key
  on public.competition_teams (competition_id, team_name)
  where source = 'web';

-- 3. Members: shadow slots (user_id NULL) claimable by claim_email, per-member withdrawal.
alter table public.competition_team_members
  alter column user_id drop not null,
  alter column email drop not null,
  alter column phone drop not null,
  add column if not exists slot smallint,
  add column if not exists claim_email text,
  add column if not exists claimed_at timestamptz,
  add column if not exists status text not null default 'active',
  add column if not exists withdrawn_at timestamptz;

alter table public.competition_team_members
  drop constraint if exists competition_team_members_status_check,
  drop constraint if exists competition_team_members_claim_email_format;

alter table public.competition_team_members
  add constraint competition_team_members_status_check
    check (status in ('active', 'withdrawn')),
  add constraint competition_team_members_claim_email_format
    check (claim_email is null or (claim_email = lower(btrim(claim_email)) and char_length(claim_email) <= 254));

-- One slot per email per team, and a fast lookup for the claim on sign-in.
create unique index if not exists competition_team_members_team_claim_email_key
  on public.competition_team_members (team_id, claim_email)
  where claim_email is not null;

create index if not exists competition_team_members_unclaimed_email_idx
  on public.competition_team_members (claim_email)
  where user_id is null;

create unique index if not exists competition_team_members_team_slot_key
  on public.competition_team_members (team_id, slot)
  where slot is not null;

-- 4. Registrations and payments: withdrawal, and payments made outside the site.
--    The current statuses are 0004's ('submitted', 'verified', 'rejected'); this only adds one.
alter table public.competition_registrations
  drop constraint if exists competition_registrations_status_check;
alter table public.competition_registrations
  add constraint competition_registrations_status_check
    check (status in ('submitted', 'verified', 'rejected', 'withdrawn'));

alter table public.payments
  drop constraint if exists payments_provider_check;
alter table public.payments
  add constraint payments_provider_check
    check (provider in ('mock', 'midtrans', 'manual'));

-- 5. The raw form submission behind an imported team: NISNs, document links and the fee tier.
--    Personal data, so admins only. It is kept off competition_team_members because team members
--    can read each other's member rows.
create table if not exists public.competition_form_submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.competition_teams(id) on delete cascade,
  competition_id uuid not null references public.competitions(id),
  -- sha256 of (form timestamp, leader email): re-running the import updates instead of duplicating.
  source_key text not null unique,
  submitted_at timestamptz not null,
  submitter_email text,
  fee_tier text,
  fee_amount integer check (fee_amount is null or fee_amount >= 0),
  -- [{ slot, role, name, nisn, student_card_url }]
  members jsonb not null default '[]'::jsonb,
  -- { twibbon, follow_instagram, share_info, story_poster, integrity_pact, payment_proof }
  documents jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists competition_form_submissions_competition_idx
  on public.competition_form_submissions (competition_id);

drop trigger if exists competition_form_submissions_set_updated_at on public.competition_form_submissions;
create trigger competition_form_submissions_set_updated_at
  before update on public.competition_form_submissions
  for each row execute function public.set_updated_at();

alter table public.competition_form_submissions enable row level security;

revoke all on public.competition_form_submissions from anon, authenticated;
grant select on public.competition_form_submissions to authenticated;

drop policy if exists "Admins can read form submissions" on public.competition_form_submissions;
create policy "Admins can read form submissions" on public.competition_form_submissions
  for select to authenticated
  using (public.is_admin((select auth.uid())));
