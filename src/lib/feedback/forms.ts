import { createServiceClient } from '@/lib/supabase/server'

import { questionListSchema, type Question } from './schema'

export type FeedbackContext = 'event' | 'booth' | 'inspirates' | 'competition' | 'pre_event'

export type FeedbackForm = {
  id: string
  slug: string
  title: string
  description: string | null
  context: FeedbackContext
  questions: Question[]
  opensAt: string | null
  closesAt: string | null
  isActive: boolean
  piiRetentionDays: number
}

export type FormWindowState = 'open' | 'not_open' | 'closed' | 'inactive'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const FORM_COLUMNS =
  'id, slug, title, description, context, questions, opens_at, closes_at, is_active, pii_retention_days'

type FormRow = {
  id: string
  slug: string
  title: string
  description: string | null
  context: FeedbackContext
  questions: unknown
  opens_at: string | null
  closes_at: string | null
  is_active: boolean
  pii_retention_days: number
}

/**
 * Testing override: FEEDBACK_FORCE_OPEN=true treats every form as active and open,
 * regardless of is_active, opens_at and closes_at. Ignored when NODE_ENV is production
 * (that includes `next start` and Vercel deployments), so it cannot open forms on the live site.
 */
export function isFeedbackForceOpen() {
  return process.env.FEEDBACK_FORCE_OPEN === 'true' && process.env.NODE_ENV !== 'production'
}

export function parseFormRow(row: FormRow): FeedbackForm | null {
  const parsed = questionListSchema.safeParse(row.questions)
  if (!parsed.success) {
    // A malformed form definition is an ops error; never render or accept answers for it.
    console.error(`[feedback] Form "${row.slug}" has invalid questions:`, parsed.error.issues)
    return null
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    context: row.context,
    questions: parsed.data,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    isActive: row.is_active || isFeedbackForceOpen(),
    piiRetentionDays: row.pii_retention_days,
  }
}

export async function getFeedbackFormBySlug(slug: string): Promise<FeedbackForm | null> {
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) return null

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('feedback_forms')
    .select(FORM_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[feedback] Failed to load form', slug, error)
    return null
  }

  return data ? parseFormRow(data as FormRow) : null
}

export function getFormWindowState(
  form: Pick<FeedbackForm, 'isActive' | 'opensAt' | 'closesAt'>,
  now: Date = new Date(),
): FormWindowState {
  if (isFeedbackForceOpen()) return 'open'
  if (!form.isActive) return 'inactive'
  if (form.opensAt && now < new Date(form.opensAt)) return 'not_open'
  if (form.closesAt && now > new Date(form.closesAt)) return 'closed'
  return 'open'
}

/** Public shape of a form: everything the page needs, nothing internal. */
export function toPublicForm(form: FeedbackForm) {
  return {
    slug: form.slug,
    title: form.title,
    description: form.description,
    questions: form.questions,
    opensAt: form.opensAt,
    closesAt: form.closesAt,
    piiRetentionDays: form.piiRetentionDays,
    state: getFormWindowState(form),
  }
}

export type PublicFeedbackForm = ReturnType<typeof toPublicForm>
