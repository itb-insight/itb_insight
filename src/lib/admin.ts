import { type User } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { getAuthenticatedUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { type UserRole } from '@/lib/types/database'

export function isAdminEmail(email?: string | null) {
  return Boolean(
    email &&
      (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .includes(email.toLowerCase()),
  )
}

export async function getUserRole(user: Pick<User, 'id' | 'email'>): Promise<UserRole | null> {
  if (isAdminEmail(user.email)) {
    return 'admin'
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data?.role) {
        return data.role as UserRole
      }
    } catch {
      // Return fallback below
    }
  }

  return null
}

export async function hasUserRole(
  user: Pick<User, 'id' | 'email'>,
  allowedRoles: UserRole[],
): Promise<boolean> {
  const role = await getUserRole(user)
  if (!role) return false
  if (role === 'admin') return true
  return allowedRoles.includes(role)
}

// Admin = row in `admin_roles` with role 'admin', falling back to the ADMIN_EMAILS allowlist.
export async function isAdminUser(user: Pick<User, 'id' | 'email'>): Promise<boolean> {
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
