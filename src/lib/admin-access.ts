import 'server-only'

import { type User } from '@supabase/supabase-js'
import { cache } from 'react'

import { getUserRole } from '@/lib/admin'
import { adminLinkFor } from '@/lib/admin-nav'
import { boothAccessFor, type BoothAccess } from '@/lib/booth-points'
import { createServiceClient } from '@/lib/supabase/server'
import { type ProfileRoleA, type ProfileRoleB } from '@/lib/types/database'

/*
  What a signed-in user may open under /admin:
    - isAdmin: everything (src/app/admin/(admin-only)/layout.tsx);
    - booth:   the Booth section only (src/app/admin/booth), rules in src/lib/booth-points.ts.
  The profile role columns are not user-writable (0011), so they are safe to trust here.
*/

export type AdminAccess = {
  isAdmin: boolean
  booth: BoothAccess | null
  roleA: ProfileRoleA | null
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

// Cached per request: the /admin layout, the nested layout and the page all ask.
const loadAdminAccess = cache(
  async (id: string, email: string | undefined, emailConfirmedAt: string | undefined): Promise<AdminAccess> => {
    const [role, profile] = await Promise.all([
      getUserRole({ id, email, email_confirmed_at: emailConfirmedAt }),
      readProfileRoles(id),
    ])
    const isAdmin = role === 'admin'
    return {
      isAdmin,
      booth: boothAccessFor({
        isAdmin,
        roleA: profile?.role_a,
        roleB: profile?.role_b,
        roleC: profile?.role_c,
      }),
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
  return adminLinkFor({ isAdmin: access.isAdmin, roleA: access.roleA, boothSection: Boolean(access.booth) })
}
