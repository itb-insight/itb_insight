import 'server-only'

import { type User } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { getAuthenticatedUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { type ProfileStaffDuty, type UserRole } from '@/lib/types/database'

/** ADMIN_EMAILS, lowercased (Insight Arcade: admins never earn points, migration 0030). */
export function adminEmailList(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email?: string | null) {
  return Boolean(
    email &&
      (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .includes(email.toLowerCase()),
  )
}

type RoleSubject = Pick<User, 'id' | 'email' | 'email_confirmed_at'>

/** Duties a staff profile can hold in role_c (0024); each one grants the UserRole of that name. */
const STAFF_DUTY_ROLES: readonly ProfileStaffDuty[] = ['gate_staff']

function staffDutyRole(profile: { role_a?: string | null; role_c?: string | null } | null): ProfileStaffDuty | null {
  if (profile?.role_a !== 'staff') return null
  return STAFF_DUTY_ROLES.find((duty) => duty === profile.role_c) ?? null
}

/**
 * The one role a user acts as. Precedence: admin (ADMIN_EMAILS, profiles.role_a, admin_roles),
 * then the admin_roles row, then a staff duty in profiles.role_c (e.g. gate staff pre-assigned by
 * email in profile_role_grants, 0019/0024).
 */
export async function getUserRole(user: RoleSubject): Promise<UserRole | null> {
  // The allowlist only counts a confirmed email: anyone holding the public anon key can call
  // auth.signUp() with an arbitrary address, and that address stays unconfirmed.
  if (user.email_confirmed_at && isAdminEmail(user.email)) {
    return 'admin'
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient()
      const [{ data, error }, { data: profile }] = await Promise.all([
        supabase.from('admin_roles').select('role').eq('user_id', user.id).maybeSingle(),
        // profiles.role_a / role_c (0011, 0024) — not user-writable, so they are safe to trust here.
        supabase.from('profiles').select('role_a, role_c').eq('id', user.id).maybeSingle(),
      ])

      if (profile?.role_a === 'admin') {
        return 'admin'
      }

      if (!error && data?.role) {
        return data.role as UserRole
      }

      const duty = staffDutyRole(profile)
      if (duty) {
        return duty
      }
    } catch {
      // Return fallback below
    }
  }

  return null
}

export async function hasUserRole(
  user: RoleSubject,
  allowedRoles: UserRole[],
): Promise<boolean> {
  const role = await getUserRole(user)
  if (!role) return false
  if (role === 'admin') return true
  return allowedRoles.includes(role)
}

// Admin = row in `admin_roles` with role 'admin', falling back to the ADMIN_EMAILS allowlist.
export async function isAdminUser(user: RoleSubject): Promise<boolean> {
  return hasUserRole(user, ['admin'])
}

export type ScopedUserResult =
  | { ok: true; user: User; role: UserRole }
  | { ok: false; code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'ADMIN_ONLY'; message: string; status: 401 | 403 }

export async function getScopedUser(
  request?: NextRequest,
  allowedRoles: UserRole[] = ['admin'],
): Promise<ScopedUserResult> {
  const auth = await getAuthenticatedUser(request)

  if (!auth.ok) {
    return auth
  }

  const role = await getUserRole(auth.user)
  if (!role || (role !== 'admin' && !allowedRoles.includes(role))) {
    return {
      ok: false,
      code: allowedRoles.length === 1 && allowedRoles[0] === 'admin' ? 'ADMIN_ONLY' : 'FORBIDDEN',
      message: 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.',
      status: 403,
    }
  }

  return { ok: true, user: auth.user, role }
}

export async function getAdminUser(request?: NextRequest) {
  return getScopedUser(request, ['admin'])
}
