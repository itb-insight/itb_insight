import 'server-only'

import { type User } from '@supabase/supabase-js'
import { cache } from 'react'

import { getUserRole } from '@/lib/admin'
import { adminLinkFor } from '@/lib/admin-nav'
import { boothAccessFor, canManageBoothAccess, type BoothAccess } from '@/lib/booth-points'
import { loadAssignedBoothIds } from '@/lib/booth-roster'
import { createServiceClient } from '@/lib/supabase/server'
import { type ProfileRoleA, type ProfileRoleB, type UserRole } from '@/lib/types/database'

/*
  What a signed-in user may open under /admin:
    - isAdmin: everything (src/app/admin/(admin-only)/layout.tsx);
    - booth:   the dashboard (/admin) and the Booth section (src/app/admin/booth); booth rules in
               src/lib/booth-points.ts. The scope includes the booths assigned to the verified email
               (booth_staff_assignments, 0029).
    - boothManager: the booth access page (src/app/admin/booth-access): admins and stakeholders with
               role_b 'booth' (canManageBoothAccess).
    - gate:    the Gate section (src/app/admin/gate). Gate staff are role_a 'staff',
               role_b 'human_resource', role_c 'gate_staff' (0024), see gateAccessFor.
    - staff:   the D-day page (src/app/admin/d-day). Every staff member: committee accounts
               (role_a 'staff' / 'stakeholder'), admin_roles staff roles, booth and gate staff,
               admins. See staffAccessFor.
  The profile role columns are not user-writable (0011), so they are safe to trust here.
*/

export type AdminAccess = {
  isAdmin: boolean
  booth: BoothAccess | null
  /** Opens the booth access page: adds / removes booth assignments (canManageBoothAccess). */
  boothManager: boolean
  /** Insight Arcade duties (arcade_duties, 0032; admins always): review proofs / hand out prizes. */
  reviewer: boolean
  prizeDesk: boolean
  /** Opens the Gate section: admins, and gate staff (gateAccessFor). */
  gate: boolean
  /** Opens /admin itself and the D-day page: every staff member (staffAccessFor). */
  staff: boolean
  roleA: ProfileRoleA | null
}

/** Gate staff: role_a 'staff' + role_b 'human_resource' + role_c 'gate_staff'. Admins too. */
export function gateAccessFor(params: {
  isAdmin: boolean
  roleA: ProfileRoleA | null | undefined
  roleB: ProfileRoleB | null | undefined
  roleC: string | null | undefined
}): boolean {
  if (params.isAdmin) return true
  return params.roleA === 'staff' && params.roleB === 'human_resource' && params.roleC === 'gate_staff'
}

const STAFF_ROLE_A: readonly ProfileRoleA[] = ['staff', 'stakeholder']
const STAFF_USER_ROLES: readonly UserRole[] = ['field_staff', 'gate_staff', 'booth_staff']

/**
 * Every staff member: admins, committee accounts (role_a 'staff' / 'stakeholder'), admin_roles
 * staff roles (field / gate / booth), and anyone with the Booth or Gate section. Not exhibitors,
 * sponsors or companies.
 */
export function staffAccessFor(params: {
  isAdmin: boolean
  role: UserRole | null | undefined
  roleA: ProfileRoleA | null | undefined
  booth: boolean
  gate: boolean
}): boolean {
  if (params.isAdmin || params.booth || params.gate) return true
  if (params.roleA && STAFF_ROLE_A.includes(params.roleA)) return true
  return Boolean(params.role && STAFF_USER_ROLES.includes(params.role))
}

type AccessSubject = Pick<User, 'id' | 'email' | 'email_confirmed_at'>

type ProfileRoles = { role_a?: ProfileRoleA | null; role_b?: ProfileRoleB | null; role_c?: string | null }

async function readProfileRoles(userId: string): Promise<ProfileRoles | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  try {
    const { data } = await createServiceClient()
      .from('profiles')
      .select('role_a, role_b, role_c')
      .eq('id', userId)
      .maybeSingle()
    return (data as ProfileRoles | null) ?? null
  } catch {
    return null
  }
}

/** Active Insight Arcade duties for a verified email. Fails closed. */
async function readArcadeDuties(email: string | undefined, emailConfirmedAt: string | undefined): Promise<string[]> {
  if (!email || !emailConfirmedAt) return []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  try {
    const { data } = await createServiceClient()
      .from('arcade_duties')
      .select('duty')
      .eq('email', email.trim().toLowerCase())
      .is('revoked_at', null)
    return ((data ?? []) as Array<{ duty: string }>).map((row) => row.duty)
  } catch {
    return []
  }
}

// Cached per request: the /admin layout, the nested layout and the page all ask.
const loadAdminAccess = cache(
  async (id: string, email: string | undefined, emailConfirmedAt: string | undefined): Promise<AdminAccess> => {
    const [role, profile, assignedBoothIds, duties] = await Promise.all([
      getUserRole({ id, email, email_confirmed_at: emailConfirmedAt }),
      readProfileRoles(id),
      loadAssignedBoothIds({ email, email_confirmed_at: emailConfirmedAt }),
      readArcadeDuties(email, emailConfirmedAt),
    ])
    const isAdmin = role === 'admin'
    const roles = { isAdmin, roleA: profile?.role_a, roleB: profile?.role_b, roleC: profile?.role_c }
    const booth = boothAccessFor({ ...roles, assignedBoothIds })
    const gate = gateAccessFor(roles)
    return {
      isAdmin,
      booth,
      boothManager: canManageBoothAccess(roles),
      reviewer: isAdmin || duties.includes('reviewer'),
      prizeDesk: isAdmin || duties.includes('prize_desk'),
      gate,
      staff:
        staffAccessFor({ isAdmin, role, roleA: profile?.role_a, booth: booth !== null, gate }) || duties.length > 0,
      roleA: profile?.role_a ?? null,
    }
  },
)

export function getAdminAccess(user: AccessSubject): Promise<AdminAccess> {
  return loadAdminAccess(user.id, user.email, user.email_confirmed_at)
}

/** The header's "Admin" link for this user, or null for none (rules: src/lib/admin-nav.ts). */
export async function getAdminLink(user: AccessSubject): Promise<string | null> {
  const access = await getAdminAccess(user)
  return adminLinkFor({
    isAdmin: access.isAdmin,
    roleA: access.roleA,
    boothSection: Boolean(access.booth),
    gateSection: access.gate,
    staff: access.staff,
  })
}
