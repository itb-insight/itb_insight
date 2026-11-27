import { type ProfileRoleA } from '@/lib/types/database'

/*
  Where the header's "Admin" link goes (NavbarHifi desktop + MobileMenuHifi).

  - Admins (ADMIN_EMAILS, profiles.role_a 'admin', admin_roles 'admin') -> /admin.
  - Booth staff (role_b 'booth', see src/lib/booth-points.ts) -> /admin too: they see the
    dashboard and the Booth section there.
  - Gate staff only (no Booth section, see gateAccessFor in src/lib/admin-access.ts) -> /admin/gate,
    the one section they can open.
  - Other committee accounts, profiles.role_a 'staff' or 'stakeholder' -> the booth page of the
    hi-fi admin mock. That page 404s in production, so there the link is not shown until it goes
    live. Flip isBoothAdminLive() together with the notFound() in that page.

  Only a link: every /admin page checks access itself (src/app/admin/layout.tsx).
*/

export const ADMIN_HOME_PATH = '/admin'
export const BOOTH_SECTION_PATH = '/admin/booth'
export const GATE_SECTION_PATH = '/admin/gate'
export const BOOTH_ADMIN_PATH = '/admin-hifi/sponsor'

/** False while /admin-hifi/sponsor is a mock that 404s in production. */
export function isBoothAdminLive(): boolean {
  return process.env.NODE_ENV !== 'production'
}

const COMMITTEE_ROLES: readonly ProfileRoleA[] = ['staff', 'stakeholder']

export function adminLinkFor(params: {
  isAdmin: boolean
  roleA: ProfileRoleA | null | undefined
  /** Has the Booth section (role_b 'booth'). */
  boothSection: boolean
  /** Has the Gate section (gate staff). */
  gateSection?: boolean
}): string | null {
  if (params.isAdmin || params.roleA === 'admin') return ADMIN_HOME_PATH
  if (params.boothSection) return ADMIN_HOME_PATH
  if (params.gateSection) return GATE_SECTION_PATH
  if (params.roleA && COMMITTEE_ROLES.includes(params.roleA)) {
    return isBoothAdminLive() ? BOOTH_ADMIN_PATH : null
  }
  return null
}
