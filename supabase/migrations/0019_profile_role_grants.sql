-- Pre-assigned profile roles, keyed by email ("shadow" roles).
--
-- Committee rosters list people by email before they have an account. A row in
-- profile_role_grants gives that email's profile role_a / role_b / role_c:
--   - right away, when a profile with that verified email already exists;
--   - otherwise as soon as one appears: on profile creation (Google sign-in arrives verified) or
--     when the email is verified later (email OTP creates the auth user unverified, at code request).
-- Only a verified email counts: anyone can request a sign-in code for any address, which creates
-- an unverified auth user (same rule as the 0014 shadow slots, src/lib/competition-claims.ts).
--
-- A grant never overrides a different role_a already on the profile (an admin is never demoted to
-- staff); it stays unapplied (applied_user_id NULL) and shows up in the status query instead.
-- Editing a grant's roles re-applies it. Deleting a grant does not revoke the role from a profile.
-- Grants cannot hand out role_a = 'admin': admins are set by hand.
--
-- Writes: SQL editor / service role only. The role lists below must stay in step with the
-- profiles_role_* constraints (0011, 0018).

create table if not exists public.profile_role_grants (
  email text primary key,
  role_a text not null,
  role_b text,
  role_c text,
  -- Reference only (e.g. "Kadiv Website"); not copied to the profile.
  position text,
  applied_user_id uuid references public.profiles(id) on delete set null,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  constraint profile_role_grants_email_format
    check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  constraint profile_role_grants_role_a_check
    check (role_a in ('staff', 'stakeholder', 'sponsor_partner', 'company')),
  constraint profile_role_grants_role_b_check
    check (role_b is null or role_b in (
      'gensec', 'creative', 'event', 'fundraising', 'competition', 'field', 'marketing',
      'booth', 'webdev', 'media', 'sponsorship', 'partner'
    )),
  constraint profile_role_grants_role_b_scope
    check (role_b is null or role_a in ('staff', 'stakeholder')),
  constraint profile_role_grants_role_c_scope
    check (role_c is null or role_a = 'sponsor_partner'),
  constraint profile_role_grants_role_c_length
    check (role_c is null or char_length(role_c) between 1 and 120),
  constraint profile_role_grants_position_length
    check (position is null or char_length(position) <= 120)
);

alter table public.profile_role_grants enable row level security;
revoke all on public.profile_role_grants from anon, authenticated;
grant select, insert, update, delete on public.profile_role_grants to service_role;

-- Functions live in `private` (0009), a schema PostgREST does not expose.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Applies the grant matching this user's verified email, if any. Returns true when the profile
-- carries the grant afterwards.
create or replace function private.apply_profile_role_grant(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_grant public.profile_role_grants;
begin
  select lower(btrim(u.email)) into v_email
  from auth.users u
  where u.id = p_user_id
    and u.email_confirmed_at is not null;

  if v_email is null then
    return false;
  end if;

  select * into v_grant from public.profile_role_grants g where g.email = v_email;
  if not found then
    return false;
  end if;

  update public.profiles p
  set role_a = v_grant.role_a,
      role_b = v_grant.role_b,
      role_c = v_grant.role_c
  where p.id = p_user_id
    and (p.role_a is null or p.role_a = v_grant.role_a)
    and (p.role_a, p.role_b, p.role_c) is distinct from (v_grant.role_a, v_grant.role_b, v_grant.role_c);

  if not exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and (p.role_a, p.role_b, p.role_c) is not distinct from (v_grant.role_a, v_grant.role_b, v_grant.role_c)
  ) then
    return false; -- no profile yet, or it holds a different role_a
  end if;

  -- Touches only applied_* columns, so the grant trigger below does not fire again.
  update public.profile_role_grants
  set applied_user_id = p_user_id,
      applied_at = now()
  where email = v_email
    and applied_user_id is distinct from p_user_id;

  return true;
end;
$$;

-- Sign-in path (profiles insert, auth.users verification). Never lets a grant problem block a
-- sign-in: on error it logs a warning and the sign-in goes ahead without the role.
create or replace function private.apply_profile_role_grant_on_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform private.apply_profile_role_grant(new.id);
  exception when others then
    raise warning 'profile role grant for % not applied: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

-- Admin path (grant written or edited): apply to an existing verified account. Errors surface.
create or replace function private.apply_profile_role_grant_on_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select u.id from auth.users u
    where lower(btrim(u.email)) = new.email
      and u.email_confirmed_at is not null
  loop
    perform private.apply_profile_role_grant(v_user_id);
  end loop;
  return new;
end;
$$;

revoke execute on function private.apply_profile_role_grant(uuid) from public, anon, authenticated;
revoke execute on function private.apply_profile_role_grant_on_sign_in() from public, anon, authenticated;
revoke execute on function private.apply_profile_role_grant_on_write() from public, anon, authenticated;

-- New profile (created by on_auth_user_created). Google sign-ins are verified at this point.
drop trigger if exists profiles_apply_role_grant on public.profiles;
create trigger profiles_apply_role_grant
  after insert on public.profiles
  for each row execute function private.apply_profile_role_grant_on_sign_in();

-- Email verified later (OTP) or changed. The WHEN clause keeps every other auth.users update
-- (last_sign_in_at, tokens) free.
drop trigger if exists on_auth_user_email_verified_apply_role_grant on auth.users;
create trigger on_auth_user_email_verified_apply_role_grant
  after update of email, email_confirmed_at on auth.users
  for each row
  when (
    new.email_confirmed_at is not null
    and (old.email is distinct from new.email or old.email_confirmed_at is distinct from new.email_confirmed_at)
  )
  execute function private.apply_profile_role_grant_on_sign_in();

drop trigger if exists profile_role_grants_apply on public.profile_role_grants;
create trigger profile_role_grants_apply
  after insert or update of email, role_a, role_b, role_c on public.profile_role_grants
  for each row execute function private.apply_profile_role_grant_on_write();
