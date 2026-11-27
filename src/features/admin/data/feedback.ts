import "server-only"

import { FORM_COLUMNS, parseFormRow, type FeedbackContext, type FeedbackForm } from "@/lib/feedback/forms"
import type { Answers } from "@/lib/feedback/schema"

import { selectAll } from "./query"
import type { FeedbackCategory, FeedbackInsightsDto, FeedbackRatingDto, FeedbackRowDto } from "./types"

/** The table gets the newest this many responses; averages and counts use all of them. */
export const FEEDBACK_ROW_LIMIT = 1000

type Submission = {
  id: string
  form_id: string
  user_id: string | null
  name: string | null
  overall_rating: number | null
  answers: Answers | null
  created_at: string
}

export function feedbackCategory(context: FeedbackContext): FeedbackCategory {
  if (context === "booth") return "booth"
  if (context === "competition") return "competition"
  return "event"
}

/** "Feedback Inspirates ITB Insight 2026" -> "Inspirates": the event name without the boilerplate. */
export function shortFormTitle(title: string): string {
  const short = title
    .replace(/^(feedback|form)\s+/i, "")
    .replace(/\s+itb\s+insight(\s+\d{4})?\s*$/i, "")
    .trim()
  return short || title
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Mean of the overall rating per form, then each other star or scale question rescaled to 0–5. */
export function formRatings(form: FeedbackForm, rows: Submission[]): FeedbackRatingDto[] {
  const category = feedbackCategory(form.context)
  const name = shortFormTitle(form.title)
  const out: FeedbackRatingDto[] = []

  const overall = rows.map((row) => row.overall_rating).filter((v): v is number => typeof v === "number")
  if (overall.length > 0) {
    out.push({ label: name, category, value: round1(overall.reduce((a, b) => a + b, 0) / overall.length), n: overall.length })
  }

  for (const question of form.questions) {
    if (question.type !== "stars" && question.type !== "scale") continue
    if (question.type === "stars" && question.overall) continue
    const [min, max] = question.type === "stars" ? [1, 5] : [question.min, question.max]
    const values = rows
      .map((row) => row.answers?.[question.id])
      .filter((v): v is number => typeof v === "number" && v >= min && v <= max)
    if (values.length === 0) continue
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    out.push({
      label: `${name}: ${question.label}`,
      category,
      value: round1(((mean - min) / (max - min)) * 5),
      n: values.length,
    })
  }
  return out
}

/** Every free-text answer, in question order. */
function commentOf(form: FeedbackForm | undefined, answers: Answers | null): string {
  if (!form || !answers) return ""
  return form.questions
    .filter((question) => question.type === "short" || question.type === "long")
    .map((question) => answers[question.id])
    // Skip filler answers ("-", "..", "–") people type into optional fields.
    .filter((value): value is string => typeof value === "string" && !/^[\s\p{P}]*$/u.test(value))
    .map((value) => value.trim())
    .join(" · ")
}

/** Everything on /admin/feedback, across every form. null when a query fails. */
export async function getFeedbackInsights(): Promise<FeedbackInsightsDto | null> {
  try {
    const [formRows, submissions, checkIns] = await Promise.all([
      selectAll<Parameters<typeof parseFormRow>[0]>((supabase) =>
        supabase.from("feedback_forms").select(FORM_COLUMNS).order("created_at", { ascending: false }).order("id"),
      ),
      selectAll<Submission>((supabase) =>
        supabase
          .from("feedback_submissions")
          .select("id, form_id, user_id, name, overall_rating, answers, created_at")
          .order("created_at", { ascending: false })
          .order("id"),
      ),
      selectAll<{ user_id: string }>((supabase) => supabase.from("gate_check_ins").select("user_id").order("id"), 1000, 100_000),
    ])

    const forms = formRows.map(parseFormRow).filter((form): form is FeedbackForm => form !== null)
    const formById = new Map(forms.map((form) => [form.id, form]))

    const byForm = new Map<string, Submission[]>()
    for (const row of submissions) {
      const list = byForm.get(row.form_id)
      if (list) list.push(row)
      else byForm.set(row.form_id, [row])
    }

    const ratings = forms
      .flatMap((form) => formRatings(form, byForm.get(form.id) ?? []))
      .sort((a, b) => b.value - a.value || b.n - a.n)

    const by_category: Record<FeedbackCategory, number> = { booth: 0, competition: 0, event: 0 }
    for (const row of submissions) {
      const form = formById.get(row.form_id)
      if (form) by_category[feedbackCategory(form.context)] += 1
    }

    const overall = submissions.map((row) => row.overall_rating).filter((v): v is number => typeof v === "number")

    const attendees = new Set(checkIns.map((row) => row.user_id))
    const responders = new Set(submissions.map((row) => row.user_id).filter((id): id is string => id !== null && attendees.has(id)))

    const rows: FeedbackRowDto[] = submissions.slice(0, FEEDBACK_ROW_LIMIT).map((row) => {
      const form = formById.get(row.form_id)
      return {
        id: row.id.slice(0, 6),
        category: form ? feedbackCategory(form.context) : "event",
        subject: form ? shortFormTitle(form.title) : "—",
        stars: row.overall_rating ?? 0,
        comment: commentOf(form, row.answers),
        // Names are wiped by the retention purge (private.purge_expired_feedback_pii).
        name: row.name ?? "Anonim",
        created_at: row.created_at,
      }
    })

    return {
      average: overall.length > 0 ? round1(overall.reduce((a, b) => a + b, 0) / overall.length) : null,
      total: submissions.length,
      by_category,
      responded_attendees: responders.size,
      checked_in: attendees.size,
      ratings,
      rows,
    }
  } catch (err) {
    console.error("[admin feedback] query failed:", err instanceof Error ? err.message : err)
    return null
  }
}
