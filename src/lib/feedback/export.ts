import { createServiceClient } from '@/lib/supabase/server'

import { FORM_COLUMNS, parseFormRow, type FeedbackForm } from './forms'
import { type Answers } from './schema'

const PAGE_SIZE = 1000

type SubmissionRow = {
  id: string
  form_id: string
  name: string | null
  email: string | null
  overall_rating: number | null
  answers: Answers
  created_at: string
}

async function fetchAllSubmissions(formIds: string[]): Promise<SubmissionRow[]> {
  const supabase = createServiceClient()
  const rows: SubmissionRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('feedback_submissions')
      .select('id, form_id, name, email, overall_rating, answers, created_at')
      .in('form_id', formIds)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...((data ?? []) as SubmissionRow[]))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows
}

function displayAnswer(form: FeedbackForm, questionId: string, value: unknown) {
  if (value === undefined || value === null) return ''
  const q = form.questions.find((x) => x.id === questionId)
  if (q?.type === 'choice') return q.options.find((o) => o.value === value)?.label ?? String(value)
  return value
}

/**
 * With a slug: one column per question (labels as headers, choice labels as values).
 * Without: every form, answers as raw JSON. Returns null when the slug is unknown.
 */
export async function buildFeedbackExport(slug?: string | null): Promise<{ header: string[]; rows: unknown[][] } | null> {
  const supabase = createServiceClient()
  let query = supabase
    .from('feedback_forms')
    .select(FORM_COLUMNS)
  if (slug) query = query.eq('slug', slug)
  const { data, error } = await query
  if (error) throw error

  const forms = (data ?? []).map(parseFormRow).filter((f): f is FeedbackForm => f !== null)
  if (slug && forms.length === 0) return null
  if (forms.length === 0) return { header: [], rows: [] }

  const submissions = await fetchAllSubmissions(forms.map((f) => f.id))
  const base = (s: SubmissionRow) => [s.id, s.created_at, s.name ?? '', s.email ?? '', s.overall_rating ?? '']

  if (slug) {
    const form = forms[0]
    return {
      header: ['ID', 'Waktu', 'Nama', 'Email', 'Rating Keseluruhan', ...form.questions.map((q) => q.label)],
      rows: submissions.map((s) => [...base(s), ...form.questions.map((q) => displayAnswer(form, q.id, s.answers?.[q.id]))]),
    }
  }

  const slugById = new Map(forms.map((f) => [f.id, f.slug]))
  return {
    header: ['ID', 'Waktu', 'Nama', 'Email', 'Rating Keseluruhan', 'Form', 'Jawaban (JSON)'],
    rows: submissions.map((s) => [...base(s), slugById.get(s.form_id) ?? '', JSON.stringify(s.answers ?? {})]),
  }
}
