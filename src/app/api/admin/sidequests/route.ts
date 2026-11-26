// Admin sidequest verification & management API:
//  - GET /api/admin/sidequests?status=pending: lists visitor submissions for D-Day verification,
//    along with the current window status and full sidequest catalog.
//  - POST /api/admin/sidequests: approves or rejects a visitor's sidequest submission (awarding the
//    quest's points on approval) or updates a sidequest definition (shortcut_url, points, is_active).

import { type NextRequest } from 'next/server'

import { getScopedUser } from '@/lib/admin'
import { apiError, apiSuccess } from '@/lib/api-response'
import { parseTextFields, UUID_PATTERN } from '@/lib/input'
import { getSidequestWindow, reviewSidequestSubmission } from '@/lib/sidequests'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'all'] as const

export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) return apiError(auth.code, auth.message, auth.status)

  try {
    const url = new URL(request.url)
    const statusParam = (url.searchParams.get('status') || 'pending').toLowerCase()
    if (!VALID_STATUSES.includes(statusParam as never)) {
      return apiError('INVALID_INPUT', 'Parameter status harus salah satu dari: pending, approved, rejected, all.', 400)
    }

    const db = createServiceClient()
    let subQuery = db
      .from('sidequest_submissions')
      .select(
        'id, quest_id, user_id, proof_url, note, status, points_awarded, reviewed_by, review_note, submitted_at, reviewed_at, sidequests(id, slug, category, title, points), profiles!sidequest_submissions_user_id_fkey(full_name, email, institution)',
      )
      .order('submitted_at', { ascending: false })
      .limit(200)

    if (statusParam !== 'all') {
      subQuery = subQuery.eq('status', statusParam)
    }

    const [{ data: submissions, error: subError }, { data: quests, error: questError }] = await Promise.all([
      subQuery,
      db.from('sidequests').select('*').order('order_index', { ascending: true }),
    ])

    if (subError || questError) {
      return apiError('DATABASE_ERROR', 'Gagal memuat data pengajuan sidequest.', 500)
    }

    return apiSuccess({
      window: getSidequestWindow(),
      submissions: submissions ?? [],
      quests: quests ?? [],
    })
  } catch (err) {
    console.error('[API Admin Sidequests GET Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat data verifikasi sidequest.', 500)
  }
}

export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) return apiError(auth.code, auth.message, auth.status)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Payload JSON tidak valid.', 400)
  }

  const body = typeof rawBody === 'object' && rawBody !== null ? (rawBody as Record<string, unknown>) : {}
  const fields = parseTextFields(body, {
    submissionId: 36,
    decision: 20,
    reviewNote: 500,
    questId: 36,
    shortcutUrl: 500,
  })
  if (!fields.ok) {
    return apiError('INVALID_INPUT', `Field ${fields.field} tidak valid atau terlalu panjang.`, 400)
  }

  try {
    // 1. Update a sidequest catalog item (e.g. shortcut link, points, active flag)
    if (fields.values.questId && !fields.values.submissionId) {
      const { questId, shortcutUrl } = fields.values
      if (!UUID_PATTERN.test(questId)) {
        return apiError('INVALID_INPUT', 'questId harus berformat UUID.', 400)
      }

      const patch: Record<string, unknown> = {}
      if (body.shortcutUrl !== undefined) patch.shortcut_url = shortcutUrl ?? null
      if (body.isActive !== undefined) {
        if (typeof body.isActive !== 'boolean') return apiError('INVALID_INPUT', 'isActive harus boolean.', 400)
        patch.is_active = body.isActive
      }
      if (body.points !== undefined) {
        const pts = Number(body.points)
        if (!Number.isInteger(pts) || pts < 0 || pts > 1000) {
          return apiError('INVALID_INPUT', 'points harus bilangan bulat 0..1000.', 400)
        }
        patch.points = pts
      }

      if (Object.keys(patch).length === 0) {
        return apiError('INVALID_INPUT', 'Tidak ada perubahan sidequest yang dikirim.', 400)
      }

      const { data: updatedQuest, error } = await createServiceClient()
        .from('sidequests')
        .update(patch)
        .eq('id', questId)
        .select('*')
        .maybeSingle()

      if (error) return apiError('DATABASE_ERROR', 'Gagal memperbarui sidequest.', 500)
      if (!updatedQuest) return apiError('NOT_FOUND', 'Sidequest tidak ditemukan.', 404)

      return apiSuccess({ quest: updatedQuest })
    }

    // 2. Verify (approve / reject) a visitor's sidequest submission
    const { submissionId, decision, reviewNote } = fields.values
    if (!submissionId || !UUID_PATTERN.test(submissionId)) {
      return apiError('INVALID_INPUT', 'submissionId (UUID) wajib diisi.', 400)
    }
    if (decision !== 'approved' && decision !== 'rejected') {
      return apiError('INVALID_INPUT', 'decision harus "approved" atau "rejected".', 400)
    }

    const result = await reviewSidequestSubmission({
      submissionId,
      adminUserId: auth.user.id,
      decision,
      reviewNote,
    })

    if (!result.ok) {
      const status = result.code === 'NOT_FOUND' ? 404 : result.code === 'ALREADY_REVIEWED' ? 409 : 500
      return apiError(result.code, result.message, status)
    }

    return apiSuccess({
      message:
        decision === 'approved'
          ? `Sidequest disetujui (+${result.pointsAwarded} poin).`
          : 'Sidequest ditolak.',
      submission: result.submission,
      pointsAwarded: result.pointsAwarded,
    })
  } catch (err) {
    console.error('[API Admin Sidequests POST Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memverifikasi sidequest.', 500)
  }
}
