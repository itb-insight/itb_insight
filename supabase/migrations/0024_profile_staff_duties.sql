-- Staff duties in profiles.role_c, and the Human Resource division.
--
-- role_c used to be the sponsor/partner company only. It now also holds a staff member's duty:
--   role_a = 'staff'            -> role_c is a duty from a fixed list (below), or NULL
--   role_a = 'sponsor_partner'  -> role_c is the company (free text, unchanged)
--   anything else               -> role_c is NULL
-- A duty is a permission: role_c = 'gate_staff' opens the gate check-in routes exactly like an
-- admin_roles row with role 'gate_staff' (src/lib/admin.ts getUserRole, public.has_role below).
-- Like the rest of the profile roles, role_c is not user-writable (0011 revokes it).
--
-- Gate staff are: role_a 'staff', role_b 'human_resource', role_c 'gate_staff'. Pre-assign them by
-- email in profile_role_grants (0019); the grant applies on verified sign-in.
--
-- Adding a duty: extend both role_c_scope constraints, public.has_role() is generic, and add the
-- value to STAFF_DUTY_ROLES in src/lib/admin.ts.

-- 1. profiles
alter table public.profiles
  drop constraint if exists profiles_role_b_check,
  drop constraint if exists profiles_role_c_scope;

alter table public.profiles
  add constraint profiles_role_b_check
    check (role_b is null or role_b in (
      -- 0018: committee bidang
      'gensec', 'creative', 'event', 'fundraising', 'competition', 'field', 'marketing',
      -- 0024
      'human_resource',
      -- 0011: legacy values
      'booth', 'webdev', 'media', 'sponsorship', 'partner'
    )),
  add constraint profiles_role_c_scope
    check (
      role_c is null
      or role_a = 'sponsor_partner'
      or (role_a = 'staff' and role_c in ('gate_staff'))
    );

-- 2. profile_role_grants: same lists, so a grant never fails to apply on a constraint.
alter table public.profile_role_grants
  drop constraint if exists profile_role_grants_role_b_check,
  drop constraint if exists profile_role_grants_role_c_scope;

alter table public.profile_role_grants
  add constraint profile_role_grants_role_b_check
    check (role_b is null or role_b in (
      'gensec', 'creative', 'event', 'fundraising', 'competition', 'field', 'marketing',
      'human_resource',
      'booth', 'webdev', 'media', 'sponsorship', 'partner'
    )),
  add constraint profile_role_grants_role_c_scope
    check (
      role_c is null
      or role_a = 'sponsor_partner'
      or (role_a = 'staff' and role_c in ('gate_staff'))
    );

-- 3. RLS helper: a staff duty counts as the scoped role (e.g. reading gate_check_ins).
create or replace function public.has_role(p_user_id uuid, p_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_roles
    where admin_roles.user_id = p_user_id
      and (admin_roles.role = 'admin' or admin_roles.role = p_role)
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = p_user_id
      and profiles.role_a = 'staff'
      and profiles.role_c = p_role
  );
$$;
