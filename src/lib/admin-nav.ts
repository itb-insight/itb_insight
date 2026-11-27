import { type ProfileRoleA } from '@/lib/types/database'

/*
  Where the header's "Admin" link goes (NavbarHifi desktop + MobileMenuHifi).

  - Admins (ADMIN_EMAILS, profiles.role_a 'admin', admin_roles 'admin') -> /admin.
  - Booth staff (role_b 'booth', see src/lib/booth-points.ts) -> /admin too: they see the
    dashboard and the Booth section there.
  - Gate staff without the Booth section (gateAccessFor in src/lib/admin-access.ts) -> /admin/gate,
    the section they work in (they can open D-Day from the menu there).
  - Every other staff member (staffAccessFor: committee accounts with role_a 'staff' or
    'stakeholder', admin_roles staff roles) -> /admin/d-day, the page every staff member can open.

  Only a link: every /admin page checks access itself (src/app/admin/layout.tsx).
*/

export const ADMIN_HOME_PATH = '/admin'
export const BOOTH_SECTION_PATH = '/admin/booth'
/** Booth stakeholders and admins: who can scan at which booth (canManageBoothAccess). */
export const BOOTH_ACCESS_PATH = '/admin/booth-access'
export const GATE_SECTION_PATH = '/admin/gate'
export const DDAY_PATH = '/admin/d-day'

const COMMITTEE_ROLES: readonly ProfileRoleA[] = ['staff', 'stakeholder']

export function adminLinkFor(params: {
  isAdmin: boolean
  roleA: ProfileRoleA | null | undefined
  /** Has the Booth section (role_b 'booth'). */
  boothSection: boolean
  /** Has the Gate section (gate staff). */
  gateSection?: boolean
  /** Is a staff member (opens the D-day page). */
  staff?: boolean
}): string | null {
  if (params.isAdmin || params.roleA === 'admin') return ADMIN_HOME_PATH
  if (params.boothSection) return ADMIN_HOME_PATH
  if (params.gateSection) return GATE_SECTION_PATH
  if (params.staff || (params.roleA && COMMITTEE_ROLES.includes(params.roleA))) return DDAY_PATH
  return null
}
