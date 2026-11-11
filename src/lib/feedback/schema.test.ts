import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  countWords,
  LONG_MAX_CHARS,
  LONG_MAX_WORDS,
  questionListSchema,
  SHORT_MAX_CHARS,
  validateAnswers,
  validateIdentity,
  type Question,
} from './schema'

const questions: Question[] = questionListSchema.parse([
  { id: 'overall', type: 'stars', label: 'Overall', required: true, overall: true },
  { id: 'clarity', type: 'scale', label: 'Clarity', required: true, min: 1, max: 10 },
  { id: 'part', type: 'choice', label: 'Part', required: true, options: [
    { value: 'demo', label: 'Demo' },
    { value: 'kuis', label: 'Kuis' },
  ] },
  { id: 'short', type: 'short', label: 'Short', required: false },
  { id: 'essay', type: 'long', label: 'Essay', required: false },
])

const valid = { overall: 5, clarity: 7, part: 'demo' }

describe('questionListSchema', () => {
  it('rejects duplicate question ids', () => {
    const r = questionListSchema.safeParse([
      { id: 'a', type: 'short', label: 'A' },
      { id: 'a', type: 'long', label: 'B' },
    ])
    expect(r.success).toBe(false)
  })

  it('rejects more than one overall stars question', () => {
    const r = questionListSchema.safeParse([
      { id: 'a', type: 'stars', label: 'A', overall: true },
      { id: 'b', type: 'stars', label: 'B', overall: true },
    ])
    expect(r.success).toBe(false)
  })

  it('caps 1–N scales at 10', () => {
    expect(questionListSchema.safeParse([{ id: 'a', type: 'scale', label: 'A', max: 11 }]).success).toBe(false)
    expect(questionListSchema.safeParse([{ id: 'a', type: 'scale', label: 'A', max: 10 }]).success).toBe(true)
  })

  it('rejects unknown question types', () => {
    expect(questionListSchema.safeParse([{ id: 'a', type: 'file', label: 'A' }]).success).toBe(false)
  })

  it('accepts the Inspirates seed shipped in the migration', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase/migrations/0009_feedback_forms.sql'), 'utf8')
    const json = sql.split('$json$')[1]
    const parsed = questionListSchema.safeParse(JSON.parse(json))
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.filter((q) => q.type === 'stars' && q.overall)).toHaveLength(1)
      expect(parsed.data.map((q) => q.id)).toContain('school')
    }
  })
})

describe('validateAnswers', () => {
  it('accepts a valid submission and extracts the overall rating', () => {
    const r = validateAnswers(questions, valid)
    expect(r).toEqual({ ok: true, answers: valid, overallRating: 5 })
  })

  it('requires required questions', () => {
    const r = validateAnswers(questions, { clarity: 7, part: 'demo' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.overall).toBeDefined()
  })

  it('treats whitespace-only text as empty', () => {
    const qs = questionListSchema.parse([{ id: 'name', type: 'short', label: 'N', required: true }])
    expect(validateAnswers(qs, { name: '   ' }).ok).toBe(false)
  })

  it('omits empty optional answers instead of storing them', () => {
    const r = validateAnswers(questions, { ...valid, short: '', essay: null })
    expect(r.ok && r.answers).toEqual(valid)
  })

  it('rejects unknown question ids', () => {
    const r = validateAnswers(questions, { ...valid, injected: 'x' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors._form).toBeDefined()
  })

  it('rejects non-object payloads', () => {
    for (const raw of [null, 'x', 5, [valid]]) {
      expect(validateAnswers(questions, raw).ok).toBe(false)
    }
  })

  it.each([0, 6, 4.5, '5', true])('rejects star value %s', (overall) => {
    expect(validateAnswers(questions, { ...valid, overall }).ok).toBe(false)
  })

  it.each([0, 11, '7'])('rejects scale value %s', (clarity) => {
    expect(validateAnswers(questions, { ...valid, clarity }).ok).toBe(false)
  })

  it('rejects choice values outside the options', () => {
    expect(validateAnswers(questions, { ...valid, part: 'hack' }).ok).toBe(false)
  })

  it('caps short answers', () => {
    expect(validateAnswers(questions, { ...valid, short: 'a'.repeat(SHORT_MAX_CHARS) }).ok).toBe(true)
    expect(validateAnswers(questions, { ...valid, short: 'a'.repeat(SHORT_MAX_CHARS + 1) }).ok).toBe(false)
  })

  it('caps essays by words', () => {
    const words = (n: number) => Array.from({ length: n }, () => 'kata').join(' ')
    expect(validateAnswers(questions, { ...valid, essay: words(LONG_MAX_WORDS) }).ok).toBe(true)
    expect(validateAnswers(questions, { ...valid, essay: words(LONG_MAX_WORDS + 1) }).ok).toBe(false)
  })

  it('caps essays by characters when there are no spaces', () => {
    expect(validateAnswers(questions, { ...valid, essay: 'x'.repeat(LONG_MAX_CHARS + 1) }).ok).toBe(false)
  })

  it('strips control characters (NUL breaks Postgres text)', () => {
    const r = validateAnswers(questions, { ...valid, short: 'ha\u0000lo\u0007', essay: 'baris 1\r\nbaris 2' })
    expect(r.ok && r.answers.short).toBe('halo')
    expect(r.ok && r.answers.essay).toBe('baris 1\nbaris 2')
  })
})

describe('countWords', () => {
  it('counts across any whitespace', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('  satu\n\ndua\ttiga ')).toBe(3)
  })
})

describe('validateIdentity', () => {
  it('normalises name and email', () => {
    expect(validateIdentity('  Budi   Santoso ', ' Budi@Example.COM ')).toEqual({
      ok: true,
      name: 'Budi Santoso',
      email: 'budi@example.com',
    })
  })

  it('requires both fields', () => {
    const r = validateIdentity('', '')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['email', 'name'])
  })

  it.each(['budi', 'budi@', '@example.com', 'budi example@x.com'])('rejects email %s', (email) => {
    expect(validateIdentity('Budi', email).ok).toBe(false)
  })

  it('caps the name length', () => {
    expect(validateIdentity('a'.repeat(101), 'a@b.co').ok).toBe(false)
  })
})
