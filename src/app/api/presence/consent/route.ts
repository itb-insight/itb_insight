import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/server'

// Opt in to (POST) or out of (DELETE) booth presence. Opting out also deletes every presence
// row of the user: withdrawing consent removes the data collected under it.

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  const rate = checkRateLimit(request, { scope: 'presence-consent', identity: auth.user.id, limit: 10, windowMs: 10 * 60_000 })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  const consentAt = new Date().toISOString()
  const { error } = await createServiceClient()
    .from('profiles')
    .update({ presence_consent_at: consentAt })
    .eq('id', auth.user.id)
  if (error) {
    console.error('[API Presence Consent Error]', error.message)
    return apiError('SERVER_ERROR', 'Gagal menyimpan persetujuan.', 500)
  }
  return apiSuccess({ consented: true, consentAt })
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  const rate = checkRateLimit(request, { scope: 'presence-consent', identity: auth.user.id, limit: 10, windowMs: 10 * 60_000 })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  const supabase = createServiceClient()
  const [profile, visits] = await Promise.all([
    supabase.from('profiles').update({ presence_consent_at: null }).eq('id', auth.user.id),
    supabase.from('booth_presence').delete().eq('user_id', auth.user.id),
  ])
  if (profile.error || visits.error) {
    console.error('[API Presence Consent Error]', profile.error?.message ?? visits.error?.message)
    return apiError('SERVER_ERROR', 'Gagal mencabut persetujuan. Coba lagi.', 500)
  }
  return apiSuccess({ consented: false })
}
