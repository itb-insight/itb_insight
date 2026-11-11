import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { resolveAccountIdentity } from '@/lib/feedback/account'
import { getFeedbackFormBySlug, toPublicForm } from '@/lib/feedback/forms'
import { processSubmission } from '@/lib/feedback/submit'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Per email/account: enough to fix validation errors a few times.
// Per IP: high, because a whole class submits from one school NAT at the same moment.
const RATE_LIMIT = { limit: 10, ipLimit: 300, windowMs: 10 * 60_000 } as const

// Returns the form plus, for a signed-in caller, the name and email the submission will be
// stored under (shown read-only in the form). Per-user, so never cache it.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const form = await getFeedbackFormBySlug(slug)
  if (!form || !form.isActive) {
    return apiError('FORM_NOT_FOUND', 'Form feedback tidak ditemukan.', 404)
  }

  const auth = await getAuthenticatedUser(request)
  const account = auth.ok ? await resolveAccountIdentity({ id: auth.user.id, email: auth.user.email }) : null

  const response = apiSuccess({ form: toPublicForm(form), account })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const form = await getFeedbackFormBySlug(slug)
    if (!form || !form.isActive) {
      return apiError('FORM_NOT_FOUND', 'Form feedback tidak ditemukan.', 404)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiError('INVALID_INPUT', 'Body harus berupa JSON.', 400)
    }

    const auth = await getAuthenticatedUser(request)
    const account = auth.ok ? { id: auth.user.id, email: auth.user.email } : null

    const bodyEmail =
      typeof body === 'object' && body !== null && typeof (body as { email?: unknown }).email === 'string'
        ? (body as { email: string }).email.trim().toLowerCase()
        : ''
    const rate = checkRateLimit(request, {
      scope: 'feedback-submit',
      identity: account ? `user:${account.id}` : `email:${bodyEmail || 'none'}`,
      ...RATE_LIMIT,
    })
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

    const outcome = await processSubmission({ form, body, account, remoteIp: getClientIp(request) })

    if (!outcome.ok) {
      return Response.json(
        {
          success: false,
          data: null,
          error: { code: outcome.code, message: outcome.message, fields: outcome.fieldErrors ?? null },
        },
        { status: outcome.status },
      )
    }

    return apiSuccess({ message: 'Terima kasih atas feedback-mu!' }, 201)
  } catch (err) {
    console.error('[API Feedback Submit Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat menyimpan feedback.', 500)
  }
}
