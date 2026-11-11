// Feedback form definitions and answer validation. Pure module: no server imports, so the
// client form reuses the same limits and word counter the API enforces.
import { z } from 'zod'

export const STARS_MIN = 1
export const STARS_MAX = 5
export const SHORT_MAX_CHARS = 200
export const LONG_MAX_WORDS = 1000
// Backstop for text without spaces, which a word count cannot catch (~7 chars per word).
export const LONG_MAX_CHARS = 7000
export const SCALE_MAX_LIMIT = 10
export const NAME_MAX_CHARS = 100
// Submissions completed faster than this are treated as bots.
export const MIN_FILL_MS = 2500

// ─── Question definitions (stored in feedback_forms.questions) ───────────────

const questionBase = {
  id: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/, 'Question id must be snake_case.'),
  label: z.string().min(1).max(300),
  help: z.string().max(300).optional(),
  required: z.boolean().default(false),
}

const choiceOption = z.object({
  value: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,59}$/),
  label: z.string().min(1).max(200),
})

export const questionSchema = z.discriminatedUnion('type', [
  z.object({ ...questionBase, type: z.literal('stars'), overall: z.boolean().optional() }),
  z.object({ ...questionBase, type: z.literal('long') }),
  z.object({ ...questionBase, type: z.literal('short') }),
  z
    .object({
      ...questionBase,
      type: z.literal('scale'),
      min: z.union([z.literal(0), z.literal(1)]).default(1),
      max: z.number().int().min(2).max(SCALE_MAX_LIMIT),
      minLabel: z.string().max(60).optional(),
      maxLabel: z.string().max(60).optional(),
    }),
  z.object({
    ...questionBase,
    type: z.literal('choice'),
    options: z.array(choiceOption).min(2).max(20),
  }),
])

export const questionListSchema = z
  .array(questionSchema)
  .min(1)
  .max(50)
  .superRefine((questions, ctx) => {
    const ids = new Set<string>()
    for (const q of questions) {
      if (ids.has(q.id)) ctx.addIssue({ code: 'custom', message: `Duplicate question id "${q.id}".` })
      ids.add(q.id)
      if (q.type === 'choice' && new Set(q.options.map((o) => o.value)).size !== q.options.length) {
        ctx.addIssue({ code: 'custom', message: `Duplicate option value in "${q.id}".` })
      }
    }
    if (questions.filter((q) => q.type === 'stars' && q.overall).length > 1) {
      ctx.addIssue({ code: 'custom', message: 'At most one stars question can be the overall rating.' })
    }
  })

export type Question = z.infer<typeof questionSchema>
export type QuestionType = Question['type']
export type AnswerValue = string | number
export type Answers = Record<string, AnswerValue>

// ─── Text helpers ────────────────────────────────────────────────────────────

export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/u).length : 0
}

// Postgres rejects NUL in text; other C0 controls are never legitimate form input.
// Keeps tab and newline.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export function cleanText(value: string, { singleLine }: { singleLine: boolean }): string {
  const cleaned = value.replace(CONTROL_CHARS, '').replace(/\r\n?/g, '\n')
  return (singleLine ? cleaned.replace(/\s+/g, ' ') : cleaned).trim()
}

// ─── Answer validation ───────────────────────────────────────────────────────

export type AnswerValidation =
  | { ok: true; answers: Answers; overallRating: number | null }
  | { ok: false; errors: Record<string, string> }

function isEmpty(value: unknown) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
}

function validateOne(q: Question, raw: unknown): { value: AnswerValue } | { error: string } {
  switch (q.type) {
    case 'stars':
    case 'scale': {
      const min = q.type === 'stars' ? STARS_MIN : q.min
      const max = q.type === 'stars' ? STARS_MAX : q.max
      if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < min || raw > max) {
        return { error: `Pilih nilai ${min}–${max}.` }
      }
      return { value: raw }
    }
    case 'short': {
      if (typeof raw !== 'string') return { error: 'Jawaban harus berupa teks.' }
      const text = cleanText(raw, { singleLine: true })
      if (text.length > SHORT_MAX_CHARS) return { error: `Maksimal ${SHORT_MAX_CHARS} karakter.` }
      return { value: text }
    }
    case 'long': {
      if (typeof raw !== 'string') return { error: 'Jawaban harus berupa teks.' }
      const text = cleanText(raw, { singleLine: false })
      if (countWords(text) > LONG_MAX_WORDS) return { error: `Maksimal ${LONG_MAX_WORDS} kata.` }
      if (text.length > LONG_MAX_CHARS) return { error: `Maksimal ${LONG_MAX_CHARS} karakter.` }
      return { value: text }
    }
    case 'choice': {
      if (typeof raw !== 'string' || !q.options.some((o) => o.value === raw)) {
        return { error: 'Pilih salah satu opsi.' }
      }
      return { value: raw }
    }
  }
}

/**
 * Validates raw answers against a form. Rejects unknown question ids, so the stored jsonb
 * only ever holds keys the form defines. Empty optional answers are omitted, not stored.
 */
export function validateAnswers(questions: readonly Question[], raw: unknown): AnswerValidation {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: { _form: 'Format jawaban tidak valid.' } }
  }

  const input = raw as Record<string, unknown>
  const errors: Record<string, string> = {}
  const answers: Answers = {}
  const known = new Set(questions.map((q) => q.id))

  for (const key of Object.keys(input)) {
    if (!known.has(key)) errors._form = 'Jawaban berisi pertanyaan yang tidak dikenal.'
  }

  for (const q of questions) {
    const value = input[q.id]
    if (isEmpty(value)) {
      if (q.required) errors[q.id] = 'Wajib diisi.'
      continue
    }
    const result = validateOne(q, value)
    if ('error' in result) {
      errors[q.id] = result.error
    } else if (!(typeof result.value === 'string' && result.value === '')) {
      answers[q.id] = result.value
    } else if (q.required) {
      errors[q.id] = 'Wajib diisi.'
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const overall = questions.find((q) => q.type === 'stars' && q.overall)
  const overallRating = overall && typeof answers[overall.id] === 'number' ? (answers[overall.id] as number) : null

  return { ok: true, answers, overallRating }
}

// ─── Submission envelope (POST /api/feedback/[slug]) ─────────────────────────

export const submissionSchema = z.object({
  name: z.string().max(NAME_MAX_CHARS * 2).default(''),
  email: z.string().max(254 * 2).default(''),
  answers: z.unknown(),
  consent: z.literal(true, { error: 'Persetujuan wajib dicentang.' }),
  // Honeypot: a visually hidden field humans never fill.
  website: z.string().max(500).optional(),
  // Milliseconds between form render and submit, measured by the client.
  elapsedMs: z.number().nonnegative().max(1e9),
  turnstileToken: z.string().max(4096).optional(),
})

export type SubmissionInput = z.infer<typeof submissionSchema>

const emailSchema = z.email()

/** Validates and normalises name/email for anonymous submitters. */
export function validateIdentity(name: string, email: string):
  | { ok: true; name: string; email: string }
  | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const cleanName = cleanText(name, { singleLine: true })
  const cleanEmail = email.trim().toLowerCase()

  if (!cleanName) errors.name = 'Nama wajib diisi.'
  else if (cleanName.length > NAME_MAX_CHARS) errors.name = `Maksimal ${NAME_MAX_CHARS} karakter.`

  if (!cleanEmail) errors.email = 'Email wajib diisi.'
  else if (cleanEmail.length > 254 || !emailSchema.safeParse(cleanEmail).success) {
    errors.email = 'Format email tidak valid.'
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, name: cleanName, email: cleanEmail }
}
