import { createServiceClient } from '@/lib/supabase/server'

import { FORM_COLUMNS, parseFormRow, type FeedbackForm } from './forms'
import { type Answers, type Question } from './schema'

type QuestionSummary =
  | { id: string; type: 'stars' | 'scale'; label: string; answered: number; average: number; counts: Record<number, number> }
  | { id: string; type: 'choice'; label: string; answered: number; counts: Record<string, number> }
  | { id: string; type: 'short' | 'long'; label: string; answered: number }

export type FormSummary = {
  slug: string
  title: string
  total: number
  ratedCount: number
  averageRating: number | null
  questions: QuestionSummary[]
}

const round2 = (n: number) => Number(n.toFixed(2))

export function summarizeForm(form: FeedbackForm, rows: { overall_rating: number | null; answers: Answers }[]): FormSummary {
  const rated = rows.map((r) => r.overall_rating).filter((r): r is number => typeof r === 'number')

  const questions = form.questions.map((q: Question): QuestionSummary => {
    const values = rows.map((r) => r.answers?.[q.id]).filter((v) => v !== undefined && v !== null && v !== '')

    if (q.type === 'stars' || q.type === 'scale') {
      const nums = values.filter((v): v is number => typeof v === 'number')
      const counts: Record<number, number> = {}
      const [min, max] = q.type === 'stars' ? [1, 5] : [q.min, q.max]
      for (let i = min; i <= max; i++) counts[i] = 0
      nums.forEach((n) => (counts[n] = (counts[n] ?? 0) + 1))
      const average = nums.length ? round2(nums.reduce((a, b) => a + b, 0) / nums.length) : 0
      return { id: q.id, type: q.type, label: q.label, answered: nums.length, average, counts }
    }

    if (q.type === 'choice') {
      const counts: Record<string, number> = Object.fromEntries(q.options.map((o) => [o.value, 0]))
      values.forEach((v) => {
        if (typeof v === 'string') counts[v] = (counts[v] ?? 0) + 1
      })
      return { id: q.id, type: 'choice', label: q.label, answered: values.length, counts }
    }

    return { id: q.id, type: q.type, label: q.label, answered: values.length }
  })

  return {
    slug: form.slug,
    title: form.title,
    total: rows.length,
    ratedCount: rated.length,
    averageRating: rated.length ? round2(rated.reduce((a, b) => a + b, 0) / rated.length) : null,
    questions,
  }
}

/** Aggregates per form. Free-text answers are counted, not returned: use the CSV export. */
export async function getFeedbackSummaries(slug?: string): Promise<FormSummary[]> {
  const supabase = createServiceClient()
  let formQuery = supabase
    .from('feedback_forms')
    .select(FORM_COLUMNS)
    .order('created_at', { ascending: false })
  if (slug) formQuery = formQuery.eq('slug', slug)

  const { data: formRows, error } = await formQuery
  if (error) throw error

  const forms = (formRows ?? []).map(parseFormRow).filter((f): f is FeedbackForm => f !== null)
  if (forms.length === 0) return []

  // PostgREST caps each response (1000 rows by default), so page through.
  type Row = { form_id: string; overall_rating: number | null; answers: Answers }
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error: rowsError } = await supabase
      .from('feedback_submissions')
      .select('form_id, overall_rating, answers')
      .in('form_id', forms.map((f) => f.id))
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (rowsError) throw rowsError
    rows.push(...((data ?? []) as Row[]))
    if (!data || data.length < PAGE_SIZE) break
  }

  return forms.map((form) => summarizeForm(form, rows.filter((r) => r.form_id === form.id)))
}

const PAGE_SIZE = 1000
