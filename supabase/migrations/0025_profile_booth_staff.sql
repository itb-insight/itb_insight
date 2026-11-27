-- Booth staff in the profile roles.
--
-- role_b 'booth' opens the Booth section of /admin (scan a visitor's QR, give booth points) for
-- staff and stakeholders. Which booths (src/lib/booth-points.ts boothAccessFor):
--   stakeholder + role_b 'booth' -> every booth, automatically; role_c stays NULL.
--   staff       + role_b 'booth' -> role_c = the booth type they work at. For now the only value is
--                                   'all' (every booth); add types to both role_c_scope constraints
--                                   below when the booths are split up.
-- Pre-assign them by email in profile_role_grants (0019).
--
-- role_c for staff after this migration:
--   'gate_staff'  any staff (0024: opens the gate check-in routes)
--   'all'         booth staff only (role_b 'booth')
-- role_c for sponsor_partner stays the company (free text). Like the other profile roles, role_c is
-- not user-writable (0011 revokes it).

alter table public.profiles
  drop constraint if exists profiles_role_c_scope;

alter table public.profiles
  add constraint profiles_role_c_scope
    check (
      role_c is null
      or role_a = 'sponsor_partner'
      or (role_a = 'staff' and role_c in ('gate_staff'))
      or (role_a = 'staff' and role_b = 'booth' and role_c in ('all'))
    );

-- Same rule, so a grant never fails to apply on the profile constraint.
alter table public.profile_role_grants
  drop constraint if exists profile_role_grants_role_c_scope;

alter table public.profile_role_grants
  add constraint profile_role_grants_role_c_scope
    check (
      role_c is null
      or role_a = 'sponsor_partner'
      or (role_a = 'staff' and role_c in ('gate_staff'))
      or (role_a = 'staff' and role_b = 'booth' and role_c in ('all'))
    );
