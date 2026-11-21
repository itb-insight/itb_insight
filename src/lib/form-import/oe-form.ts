import { createHash } from 'node:crypto'

/*
  Olimpiade Engineering Google Form → import records. Pure: no database, no env. The import
  script (scripts/import-oe-registrations.ts) reads the sheet with readXlsxRows() and writes what
  parseOeSheet() returns.

  A row with an ERROR is not imported. A WARNING is imported as-is and listed in the report.
*/

export type FeeTier = { key: string; label: string; amount: number }

export type IssueCode =
  | 'MISSING_FIELD'
  | 'INVALID_EMAIL'
  | 'INVALID_TIMESTAMP'
  | 'UNKNOWN_FEE_TIER'
  | 'FEE_AMOUNT_MISMATCH'
  | 'NISN_FORMAT'
  | 'NISN_PADDED'
  | 'NISN_DUPLICATE'
  | 'PHONE_FORMAT'
  | 'TEAM_NAME_DUPLICATE'
  | 'SUBMITTER_DIFFERS'
  | 'DUPLICATE_SUBMISSION'

export type Issue = { level: 'error' | 'warning'; code: IssueCode; field?: string; detail?: string }

export type OeMember = {
  slot: 1 | 2 | 3
  role: 'leader' | 'member'
  name: string
  nisn: string | null
  studentCardUrl: string | null
}

export type OeRecord = {
  /** 1-based row number in the sheet, for the report. */
  row: number
  sourceKey: string
  submittedAt: string
  submitterEmail: string | null
  teamName: string
  school: string
  leaderEmail: string
  leaderPhone: string | null
  members: [OeMember, OeMember, OeMember]
  feeTier: FeeTier
  documents: {
    twibbon: string | null
    follow_instagram: string | null
    share_info: string | null
    story_poster: string | null
    integrity_pact: string | null
    payment_proof: string | null
  }
}

export type ParsedRow = { row: number; teamName: string; record: OeRecord | null; issues: Issue[] }

/** Header text each column starts with (headers carry long instructions after a newline). */
const COLUMNS = {
  timestamp: 'Timestamp',
  submitterEmail: 'Email Address',
  teamName: 'Nama Tim',
  school: 'Sekolah Asal',
  leaderName: 'Nama Lengkap Ketua Tim',
  leaderNisn: 'NISN Ketua Tim',
  leaderCard: 'Foto Kartu Pelajar Ketua Tim',
  leaderEmail: 'Email Aktif Ketua Tim',
  leaderPhone: 'Nomor WhatsApp Aktif Ketua Tim',
  member1Name: 'Nama Lengkap Anggota 1',
  member1Nisn: 'NISN Anggota 1',
  member1Card: 'Foto Kartu Pelajar Anggota 1',
  member2Name: 'Nama Lengkap Anggota 2',
  member2Nisn: 'NISN Anggota 2',
  member2Card: 'Foto Kartu Pelajar Anggota 2',
  twibbon: 'Bukti Unggah Twibbon',
  followInstagram: 'Bukti Follow Instagram',
  shareInfo: 'Bukti Share Informasi Kompetisi',
  storyPoster: 'Bukti Post Story Instagram Poster',
  integrityPact: 'Pakta Integritas',
  feeTier: 'Gelombang pendaftaran',
  paymentProof: 'Bukti Pembayaran',
} as const

type Column = keyof typeof COLUMNS

/** Maps every expected column to its index, or throws naming the missing headers. */
export function mapColumns(header: string[]): Record<Column, number> {
  const normalized = header.map((cell) => collapse(cell).toLowerCase())
  const missing: string[] = []
  const map = {} as Record<Column, number>

  for (const [key, label] of Object.entries(COLUMNS) as Array<[Column, string]>) {
    const index = normalized.findIndex((cell) => cell.startsWith(label.toLowerCase()))
    if (index === -1) missing.push(label)
    else map[key] = index
  }

  if (missing.length) throw new Error(`Form columns not found: ${missing.join(', ')}`)
  return map
}

/** Trims, drops invisible formatting characters and collapses runs of whitespace. */
export function collapse(value: string | undefined) {
  return (value ?? '').replace(/[​-‏‪-‮⁦-⁩﻿]/g, '').replace(/\s+/g, ' ').trim()
}

export function normalizeEmail(value: string) {
  return collapse(value).toLowerCase()
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

/**
 * Sheets stores digit-only answers as numbers, sometimes in scientific notation ("3.1234567E9"),
 * which also drops leading zeros. Returns the integer as a digit string, or null when the cell is
 * not a plain number.
 */
function numericCellDigits(value: string) {
  // A plain digit string is text as typed (leading zeros intact): only decimal/scientific forms
  // are numbers Sheets reformatted.
  if (!/^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) || /^\d+$/.test(value)) return null
  const number = Number(value)
  return Number.isSafeInteger(number) ? String(number) : null
}

/** NISN is 10 digits. Numbers that lost their leading zeros are padded back. */
export function normalizeNisn(raw: string): { value: string | null; issues: Issue[] } {
  const text = collapse(raw)
  const numeric = numericCellDigits(text)
  const digits = numeric ?? text.replace(/\D/g, '')

  if (!digits) return { value: null, issues: [{ level: 'warning', code: 'NISN_FORMAT', detail: 'empty or not a number' }] }
  if (digits.length === 10) return { value: digits, issues: [] }
  if (numeric && digits.length >= 7 && digits.length < 10) {
    return { value: digits.padStart(10, '0'), issues: [{ level: 'warning', code: 'NISN_PADDED', detail: `${digits.length} digits` }] }
  }
  return { value: digits, issues: [{ level: 'warning', code: 'NISN_FORMAT', detail: `${digits.length} digits` }] }
}

/** Indonesian mobile number in local form: 08xxxxxxxx. */
export function normalizePhone(raw: string): { value: string | null; issues: Issue[] } {
  const text = collapse(raw)
  let digits = numericCellDigits(text) ?? text.replace(/\D/g, '')
  if (!digits) return { value: null, issues: [{ level: 'warning', code: 'PHONE_FORMAT', detail: 'empty' }] }

  if (digits.startsWith('62')) digits = `0${digits.slice(2)}`
  else if (digits.startsWith('8')) digits = `0${digits}`

  if (/^08\d{7,12}$/.test(digits)) return { value: digits, issues: [] }
  return { value: digits, issues: [{ level: 'warning', code: 'PHONE_FORMAT', detail: `${digits.length} digits` }] }
}

/**
 * A Sheets date serial (days since 1899-12-30, in the sheet's time zone) to an ISO timestamp.
 * Google Forms response sheets for this event use Asia/Jakarta (UTC+7, no DST).
 */
export function serialToIso(serial: string, utcOffsetHours = 7): string | null {
  const days = Number(serial)
  if (!Number.isFinite(days) || days < 40000 || days > 80000) return null
  const localMs = Math.round((days - 25569) * 86_400_000)
  return new Date(localMs - utcOffsetHours * 3_600_000).toISOString()
}

/** "Late Registration : Rp175.000 / tim : periode …" → the tier whose label it starts with. */
export function matchFeeTier(raw: string, tiers: FeeTier[]): { tier: FeeTier | null; issues: Issue[] } {
  const text = collapse(raw)
  const tier = tiers.find((candidate) => text.toLowerCase().startsWith(candidate.label.toLowerCase())) ?? null
  if (!tier) return { tier: null, issues: [{ level: 'error', code: 'UNKNOWN_FEE_TIER', field: 'feeTier' }] }

  const stated = /rp\s*([\d.,]+)/i.exec(text)?.[1]
  const statedAmount = stated ? Number(stated.replace(/[.,]/g, '')) : null
  if (statedAmount !== null && statedAmount !== tier.amount) {
    return {
      tier: null,
      issues: [{ level: 'error', code: 'FEE_AMOUNT_MISMATCH', field: 'feeTier', detail: `form Rp${statedAmount}, catalog Rp${tier.amount}` }],
    }
  }
  return { tier, issues: [] }
}

export function sourceKey(timestampCell: string, leaderEmail: string) {
  return createHash('sha256').update(`${collapse(timestampCell)}|${leaderEmail}`).digest('hex')
}

const link = (value: string | undefined) => collapse(value) || null

function parseRow(cells: string[], row: number, col: Record<Column, number>, tiers: FeeTier[]): ParsedRow {
  const get = (key: Column) => collapse(cells[col[key]])
  const issues: Issue[] = []
  const teamName = get('teamName')

  const required: Column[] = ['timestamp', 'teamName', 'school', 'leaderName', 'leaderEmail', 'member1Name', 'member2Name', 'feeTier']
  for (const key of required) {
    if (!get(key)) issues.push({ level: 'error', code: 'MISSING_FIELD', field: key })
  }

  const submittedAt = get('timestamp') ? serialToIso(get('timestamp')) : null
  if (get('timestamp') && !submittedAt) issues.push({ level: 'error', code: 'INVALID_TIMESTAMP', field: 'timestamp' })

  const leaderEmail = normalizeEmail(get('leaderEmail'))
  if (leaderEmail && !isEmail(leaderEmail)) issues.push({ level: 'error', code: 'INVALID_EMAIL', field: 'leaderEmail' })

  const submitter = normalizeEmail(get('submitterEmail'))
  const submitterEmail = submitter && isEmail(submitter) ? submitter : null
  if (submitterEmail && leaderEmail && submitterEmail !== leaderEmail) {
    issues.push({ level: 'warning', code: 'SUBMITTER_DIFFERS', detail: 'leader slot is claimable by the leader email only' })
  }

  const fee = get('feeTier') ? matchFeeTier(get('feeTier'), tiers) : { tier: null, issues: [] }
  issues.push(...fee.issues)

  const phone = normalizePhone(get('leaderPhone'))
  issues.push(...phone.issues.map((issue) => ({ ...issue, field: 'leaderPhone' })))

  const member = (slot: 1 | 2 | 3, name: Column, nisn: Column, card: Column): OeMember => {
    const parsed = normalizeNisn(get(nisn))
    issues.push(...parsed.issues.map((issue) => ({ ...issue, field: nisn })))
    return {
      slot,
      role: slot === 1 ? 'leader' : 'member',
      name: get(name),
      nisn: parsed.value,
      studentCardUrl: link(cells[col[card]]),
    }
  }

  const members: OeRecord['members'] = [
    member(1, 'leaderName', 'leaderNisn', 'leaderCard'),
    member(2, 'member1Name', 'member1Nisn', 'member1Card'),
    member(3, 'member2Name', 'member2Nisn', 'member2Card'),
  ]

  const hasError = issues.some((issue) => issue.level === 'error')
  const record: OeRecord | null =
    hasError || !submittedAt || !fee.tier
      ? null
      : {
          row,
          sourceKey: sourceKey(get('timestamp'), leaderEmail),
          submittedAt,
          submitterEmail,
          teamName,
          school: get('school'),
          leaderEmail,
          leaderPhone: phone.value,
          members,
          feeTier: fee.tier,
          documents: {
            twibbon: link(cells[col.twibbon]),
            follow_instagram: link(cells[col.followInstagram]),
            share_info: link(cells[col.shareInfo]),
            story_poster: link(cells[col.storyPoster]),
            integrity_pact: link(cells[col.integrityPact]),
            payment_proof: link(cells[col.paymentProof]),
          },
        }

  return { row, teamName, record, issues }
}

/**
 * Parses the whole response sheet (header in row 1). Empty rows are dropped. Duplicates across
 * rows (team names, NISNs) are warnings: different schools can pick the same team name.
 */
export function parseOeSheet(rows: string[][], tiers: FeeTier[]) {
  const [header, ...body] = rows
  if (!header) throw new Error('The sheet is empty.')
  const col = mapColumns(header)

  const parsed: ParsedRow[] = []
  let emptyRows = 0
  body.forEach((cells, i) => {
    if (!cells.some((cell) => collapse(cell))) {
      emptyRows += 1
      return
    }
    parsed.push(parseRow(cells, i + 2, col, tiers))
  })

  const flagDuplicates = (keyOf: (row: ParsedRow) => string[], code: IssueCode) => {
    const seen = new Map<string, number[]>()
    for (const row of parsed) for (const key of keyOf(row)) seen.set(key, [...(seen.get(key) ?? []), row.row])
    for (const row of parsed) {
      for (const key of keyOf(row)) {
        const others = (seen.get(key) ?? []).filter((other) => other !== row.row)
        if (others.length) row.issues.push({ level: 'warning', code, detail: `also in row ${others.join(', ')}` })
      }
    }
  }

  flagDuplicates((row) => (row.teamName ? [row.teamName.toLowerCase()] : []), 'TEAM_NAME_DUPLICATE')
  flagDuplicates(
    (row) => [...new Set((row.record?.members ?? []).map((m) => m.nisn).filter((nisn): nisn is string => Boolean(nisn)))],
    'NISN_DUPLICATE',
  )

  // Two rows for the same leader email and timestamp would collide on source_key: treat as error.
  const keys = new Map<string, number>()
  for (const row of parsed) {
    if (!row.record) continue
    const first = keys.get(row.record.sourceKey)
    if (first !== undefined) {
      row.issues.push({ level: 'error', code: 'DUPLICATE_SUBMISSION', detail: `same submission as row ${first}` })
      row.record = null
    } else {
      keys.set(row.record.sourceKey, row.row)
    }
  }

  return { rows: parsed, emptyRows }
}
