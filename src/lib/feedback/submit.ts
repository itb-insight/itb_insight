import { createServiceClient } from '@/lib/supabase/server'

import { getFormWindowState, type FeedbackForm } from './forms'
import { MIN_FILL_MS, submissionSchema, validateAnswers, validateIdentity } from './schema'
import { verifyTurnstile } from './turnstile'

export type SubmitterAccount = { id: string; email?: string | null }

export type SubmitOutcome =
  | { ok: true; id: string | null }
  | {
      ok: false
      status: number
      code: Uppercase<string>
      message: string
      fieldErrors?: Record<string, string>
    }

type ProcessParams = {
  form: FeedbackForm
  body: unknown
  account: SubmitterAccount | null
  remoteIp: string | null
  now?: Date
}

const fail = (
  status: number,
  code: Uppercase<string>,
  message: string,
  fieldErrors?: Record<string, string>,
): SubmitOutcome => ({ ok: false, status, code, message, fieldErrors })

async function resolveAccountIdentity(account: SubmitterAccount) {
  const supabase = createServiceClient()
  const { data } = await supabase.from('profiles').select('full_name, email').eq('id', account.id).maybeSingle()
  return {
    name: (data?.full_name as string | undefined) ?? '',
    email: (data?.email as string | undefined) ?? account.email ?? '',
  }
}

/**
 * Validates and stores one feedback submission. Order matters: cheap checks first,
 * the network call to Turnstile only after the payload is known to be well-formed.
 * Rate limiting happens in the route, before this runs.
 */
export async function processSubmission({ form, body, account, remoteIp, now = new Date() }: ProcessParams): Promise<SubmitOutcome> {
  const parsed = submissionSchema.safeParse(body)
  if (!parsed.success) {
    const consentIssue = parsed.error.issues.some((i) => i.path[0] === 'consent')
    return consentIssue
      ? fail(400, 'CONSENT_REQUIRED', 'Persetujuan penggunaan data wajib dicentang.', { consent: 'Wajib dicentang.' })
      : fail(400, 'INVALID_INPUT', 'Data yang dikirim tidak valid.')
  }
  const input = parsed.data

  // Honeypot filled: pretend success so the bot learns nothing, store nothing.
  if (input.website && input.website.trim() !== '') {
    return { ok: true, id: null }
  }

  if (input.elapsedMs < MIN_FILL_MS) {
    return fail(429, 'TOO_FAST', 'Pengisian terlalu cepat. Periksa jawabanmu lalu kirim ulang.')
  }

  const windowState = getFormWindowState(form, now)
  if (windowState === 'not_open') return fail(403, 'FORM_NOT_OPEN', 'Form feedback ini belum dibuka.')
  if (windowState !== 'open') return fail(403, 'FORM_CLOSED', 'Form feedback ini sudah ditutup.')

  // Signed-in users: identity comes from the account, never from the request body.
  const rawIdentity = account ? await resolveAccountIdentity(account) : { name: input.name, email: input.email }
  const identity = validateIdentity(rawIdentity.name, rawIdentity.email)
  const answers = validateAnswers(form.questions, input.answers)

  if (!identity.ok || !answers.ok) {
    const fieldErrors = { ...(identity.ok ? {} : identity.errors), ...(answers.ok ? {} : answers.errors) }
    if (account && !identity.ok) {
      return fail(409, 'PROFILE_INCOMPLETE', 'Lengkapi nama di profil akunmu sebelum mengisi feedback.', fieldErrors)
    }
    return fail(400, 'INVALID_INPUT', 'Periksa kembali isian yang ditandai.', fieldErrors)
  }

  if (!(await verifyTurnstile(input.turnstileToken, remoteIp))) {
    return fail(403, 'CAPTCHA_FAILED', 'Verifikasi keamanan gagal. Muat ulang halaman lalu coba lagi.')
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('feedback_submissions')
    .insert({
      form_id: form.id,
      user_id: account?.id ?? null,
      name: identity.name,
      email: identity.email,
      overall_rating: answers.overallRating,
      answers: answers.answers,
      consent_at: now.toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return fail(409, 'ALREADY_SUBMITTED', 'Feedback dengan email ini sudah pernah dikirim. Terima kasih!')
    }
    console.error('[feedback] Insert failed', error)
    return fail(500, 'SERVER_ERROR', 'Gagal menyimpan feedback. Coba lagi sebentar lagi.')
  }

  return { ok: true, id: data.id as string }
}
