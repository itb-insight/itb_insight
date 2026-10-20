import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { createInspiratesRecord, getInspiratesRecords } from '@/lib/inspirates'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['field_staff', 'admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const data = await getInspiratesRecords()
    return apiSuccess(data)
  } catch (err) {
    console.error('[API Admin Inspirates GET Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat rekap Inspirates.', 500)
  }
}

export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, ['field_staff', 'admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const body = await request.json()
    const { schoolName, activityDate, participantCount, disseminationMembers, notes } = body

    if (!schoolName || typeof participantCount !== 'number') {
      return apiError('INVALID_INPUT', 'Parameter schoolName dan participantCount wajib diisi.', 400)
    }

    const result = await createInspiratesRecord({
      schoolName,
      activityDate: activityDate || new Date().toISOString().split('T')[0],
      participantCount,
      disseminationMembers: Array.isArray(disseminationMembers) ? disseminationMembers : [],
      notes,
      createdBy: auth.user.id,
    })

    if (!result.ok) {
      return apiError('DATABASE_ERROR', result.message, 400)
    }

    return apiSuccess({
      message: 'Rekap kegiatan Inspirates berhasil dicatat.',
      record: result.record,
    })
  } catch (err) {
    console.error('[API Admin Inspirates POST Error]', err)
    return apiError('SERVER_ERROR', 'Gagal menyimpan rekap Inspirates.', 500)
  }
}
