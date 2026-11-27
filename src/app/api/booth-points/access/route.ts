import { type NextRequest } from 'next/server'

import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { grantBoothAssignment, revokeBoothAssignment } from '@/lib/booth-roster'
import { parseTextFields } from '@/lib/input'

// Booth access page (/admin/booth-access): add or remove the booths a staff member may award at.
// Body: { action: 'grant', email, boothId } | { action: 'revoke', assignmentId }
// Access: admins and stakeholders with role_b 'booth' (canManageBoothAccess, from profiles via
// getAdminAccess, never from the body). Every change is kept in booth_staff_assignments with who
// made it (assigned_by / revoked_by); revoking never deletes the row.
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  const access = await getAdminAccess(auth.user)
  if (!access.boothManager) {
    return apiError('FORBIDDEN', 'Akses ditolak: hanya stakeholder booth dan admin yang bisa mengatur akses booth.', 403)
  }

  const body: unknown = await request.json().catch(() => null)
  const fields = parseTextFields(body, { action: 20, email: 254, boothId: 80, assignmentId: 80 })
  if (!fields.ok) {
    return apiError('INVALID_INPUT', 'Data tidak valid.', 400)
  }

  const { action, email, boothId, assignmentId } = fields.values

  if (action === 'grant') {
    if (!email || !boothId) return apiError('INVALID_INPUT', 'Email dan booth wajib diisi.', 400)
    const result = await grantBoothAssignment({ actorId: auth.user.id, email, boothId })
    if (!result.ok) return apiError(result.code, result.message, result.status)
    const { ok: _ok, ...data } = result
    return apiSuccess(data, 201)
  }

  if (action === 'revoke') {
    if (!assignmentId) return apiError('INVALID_INPUT', 'Akses yang dicabut wajib diisi.', 400)
    const result = await revokeBoothAssignment({ actorId: auth.user.id, assignmentId })
    if (!result.ok) return apiError(result.code, result.message, result.status)
    const { ok: _ok, ...data } = result
    return apiSuccess(data)
  }

  return apiError('INVALID_INPUT', 'Aksi tidak dikenal.', 400)
}
