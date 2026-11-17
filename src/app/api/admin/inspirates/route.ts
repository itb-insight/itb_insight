import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { parseTextFields } from '@/lib/input'
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
    const body = await request.json().catch(() => null)
    const fields = parseTextFields(body, { schoolName: 200, activityDate: 10, notes: 2000 })
    if (!fields.ok) {
      return apiError('INVALID_INPUT', `Kolom ${fields.field} tidak valid.`, 400)
    }
    const { schoolName, activityDate, notes } = fields.values
    const { participantCount, disseminationMembers } = (body ?? {}) as Record<string, unknown>

    if (!schoolName || typeof participantCount !== 'number' || !Number.isInteger(participantCount) || participantCount < 0 || participantCount > 100_000) {
      return apiError('INVALID_INPUT', 'Parameter schoolName dan participantCount (bilangan bulat) wajib diisi.', 400)
    }
    if (activityDate && !/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
      return apiError('INVALID_INPUT', 'activityDate harus berformat YYYY-MM-DD.', 400)
    }
    const members = Array.isArray(disseminationMembers)
      ? disseminationMembers.filter((m): m is string => typeof m === 'string').map((m) => m.trim().slice(0, 120)).filter(Boolean).slice(0, 50)
      : []

    const result = await createInspiratesRecord({
      schoolName,
      activityDate: activityDate || new Date().toISOString().split('T')[0],
      participantCount,
      disseminationMembers: members,
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
