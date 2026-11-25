import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { FORM_COLUMNS, getFormWindowState, parseFormRow } from '@/lib/feedback/forms'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Feedback triggers (docs/FEEDBACK.md): the open event/booth forms this user attended (has a gate
// check-in) and has not submitted yet, plus when to check again (the next form opening), so the
// browser can pop the prompt when a form opens without polling.
// Note: this static segment shadows a form whose slug is literally "pending".

type Row = Parameters<typeof parseFormRow>[0]

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  try {
    const supabase = createServiceClient()
    const now = new Date()

    const [forms, attendance] = await Promise.all([
      supabase.from('feedback_forms').select(FORM_COLUMNS).eq('is_active', true).in('context', ['event', 'booth']),
      supabase.from('gate_check_ins').select('id', { count: 'exact', head: true }).eq('user_id', auth.user.id),
    ])
    if (forms.error) throw new Error(forms.error.message)

    const parsed = ((forms.data ?? []) as Row[])
      .map(parseFormRow)
      .filter((form): form is NonNullable<typeof form> => form !== null)

    const upcoming = parsed
      .map((form) => form.opensAt)
      .filter((opensAt): opensAt is string => !!opensAt && new Date(opensAt) > now)
      .sort()
    const nextCheckAt = upcoming[0] ?? null

    const open = parsed.filter((form) => getFormWindowState(form, now) === 'open')
    if (open.length === 0 || (attendance.count ?? 0) === 0) {
      return apiSuccess({ pending: [], nextCheckAt })
    }

    const ids = open.map((form) => form.id)
    const email = auth.user.email?.toLowerCase()
    const [byUser, byEmail] = await Promise.all([
      supabase.from('feedback_submissions').select('form_id').in('form_id', ids).eq('user_id', auth.user.id),
      email
        ? supabase.from('feedback_submissions').select('form_id').in('form_id', ids).eq('email', email)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (byUser.error || byEmail.error) throw new Error((byUser.error ?? byEmail.error)!.message)

    const submitted = new Set([...(byUser.data ?? []), ...(byEmail.data ?? [])].map((row) => row.form_id as string))
    const pending = open
      .filter((form) => !submitted.has(form.id))
      .map((form) => ({ slug: form.slug, title: form.title }))

    return apiSuccess({ pending, nextCheckAt })
  } catch (err) {
    console.error('[API Feedback Pending Error]', err instanceof Error ? err.message : err)
    return apiError('SERVER_ERROR', 'Gagal memuat feedback.', 500)
  }
}
