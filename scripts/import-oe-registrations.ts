/*
  Imports Olimpiade Engineering teams from the Google Form response export into Supabase.
  Registration ran on the form; the site only shows the teams (see migration 0014).

    npm run import:oe -- "temp/<export>.xlsx"            dry run (default): parse, compare, report
    npm run import:oe -- "temp/<export>.xlsx" --apply    write to the database in .env.local

  Each team gets: competition_teams (verified, source form_import), three member slots (the
  leader's claimable by the leader email; the members' by an email the leader invites later),
  a verified competition_registrations row, a manual paid payment at the form's fee tier, and a
  competition_form_submissions row with the NISNs and document links (admins only).

  Re-running is safe: a submission already imported (same form timestamp + leader email) only has
  its form data refreshed, plus names/school on slots nobody has claimed yet.

  The export is personal data. Keep it in temp/ (gitignored); the report goes there too and holds
  row numbers, team names and issue codes, never NISNs or phone numbers.
*/
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { createClient } from '@supabase/supabase-js'

import { getCompetitionBySlug } from '../src/lib/competitions.ts'
import { parseOeSheet, type OeRecord, type ParsedRow } from '../src/lib/form-import/oe-form.ts'
import { readXlsxRows } from '../src/lib/form-import/xlsx.ts'
import { generateTeamUid } from '../src/lib/teams.ts'

const SLUG = 'olimpiade-engineering'
const CONCURRENCY = 4

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const reportArg = args.indexOf('--report')
const reportPath = reportArg >= 0 ? args[reportArg + 1] : 'temp/oe-import-report.json'
const file = args.find((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--report')

if (!file) {
  console.error('Usage: npm run import:oe -- <export.xlsx> [--apply] [--report <path>]')
  process.exit(2)
}

const catalog = await getCompetitionBySlug(SLUG)
if (!catalog?.formFeeTiers?.length) {
  console.error(`No formFeeTiers for ${SLUG} in src/lib/competitions.ts.`)
  process.exit(2)
}

// ── Parse ───────────────────────────────────────────────────────────────────────────────────
const sheet = parseOeSheet(readXlsxRows(readFileSync(file)), catalog.formFeeTiers)
const importable = sheet.rows.filter((row): row is ParsedRow & { record: OeRecord } => Boolean(row.record))
const rejected = sheet.rows.filter((row) => !row.record)

// ── Compare with the database ───────────────────────────────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null

if (apply && !supabase) {
  console.error('--apply needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local).')
  process.exit(2)
}

let competitionId: string | null = null
const existing = new Map<string, string>() // source_key -> team_id

if (supabase) {
  const { data: competition, error } = await supabase
    .from('competitions')
    .select('id, registration_type, team_min, team_max')
    .eq('slug', SLUG)
    .maybeSingle()

  if (error || !competition || competition.registration_type !== 'team' || competition.team_max !== 3) {
    console.error(`The ${SLUG} row is missing or not a team of 3. Apply migration 0014 first.`, error?.message ?? '')
    process.exit(1)
  }
  competitionId = competition.id

  for (let from = 0; ; from += 1000) {
    const { data, error: listError } = await supabase
      .from('competition_form_submissions')
      .select('source_key, team_id')
      .eq('competition_id', competition.id)
      .range(from, from + 999)
    if (listError) {
      console.error('Could not read competition_form_submissions. Apply migration 0014 first.', listError.message)
      process.exit(1)
    }
    for (const row of data ?? []) existing.set(row.source_key, row.team_id)
    if (!data || data.length < 1000) break
  }
}

// ── Write ───────────────────────────────────────────────────────────────────────────────────
type Outcome = 'created' | 'updated' | 'failed' | 'would-create' | 'would-update' | 'not-checked'
const outcomes = new Map<number, { outcome: Outcome; error?: string }>()

function submissionRow(record: OeRecord, teamId: string) {
  return {
    team_id: teamId,
    competition_id: competitionId,
    source_key: record.sourceKey,
    submitted_at: record.submittedAt,
    submitter_email: record.submitterEmail,
    fee_tier: record.feeTier.key,
    fee_amount: record.feeTier.amount,
    members: record.members.map((m) => ({
      slot: m.slot,
      role: m.role,
      name: m.name,
      nisn: m.nisn,
      student_card_url: m.studentCardUrl,
    })),
    documents: record.documents,
  }
}

async function createTeam(db: NonNullable<typeof supabase>, record: OeRecord) {
  let teamId: string | null = null
  let lastError = ''

  for (let attempt = 0; attempt < 5 && !teamId; attempt += 1) {
    const { data, error } = await db
      .from('competition_teams')
      .insert({
        competition_id: competitionId,
        team_uid: generateTeamUid('OE'),
        team_name: record.teamName,
        leader_user_id: null,
        status: 'verified',
        source: 'form_import',
        created_at: record.submittedAt,
      })
      .select('id')
      .single()
    if (data) teamId = data.id
    else {
      lastError = error?.message ?? 'insert failed'
      if (error?.code !== '23505') break // only a team_uid collision is worth retrying
    }
  }
  if (!teamId) throw new Error(`team: ${lastError}`)

  try {
    const { error: membersError } = await db.from('competition_team_members').insert(
      record.members.map((m) => ({
        team_id: teamId,
        user_id: null,
        slot: m.slot,
        member_role: m.role,
        name: m.name,
        institution: record.school,
        email: null,
        phone: m.role === 'leader' ? record.leaderPhone : null,
        claim_email: m.role === 'leader' ? record.leaderEmail : null,
        joined_at: record.submittedAt,
      })),
    )
    if (membersError) throw new Error(`members: ${membersError.message}`)

    const { error: submissionError } = await db.from('competition_form_submissions').insert(submissionRow(record, teamId))
    if (submissionError) throw new Error(`form submission: ${submissionError.message}`)

    const { data: registration, error: registrationError } = await db
      .from('competition_registrations')
      .insert({
        competition_id: competitionId,
        registration_kind: 'team',
        team_id: teamId,
        status: 'verified',
        submitted_at: record.submittedAt,
        note: 'Imported from the Google Form registration.',
      })
      .select('id')
      .single()
    if (registrationError || !registration) throw new Error(`registration: ${registrationError?.message}`)

    const { error: paymentError } = await db.from('payments').insert({
      registration_id: registration.id,
      provider: 'manual',
      status: 'paid',
      amount: record.feeTier.amount,
      currency: 'IDR',
      paid_at: record.submittedAt,
    })
    if (paymentError) throw new Error(`payment: ${paymentError.message}`)
  } catch (error) {
    // Undo the partial team. Registrations do not cascade from teams; payments cascade from
    // registrations; members and the form submission cascade from the team.
    await db.from('competition_registrations').delete().eq('team_id', teamId)
    await db.from('competition_teams').delete().eq('id', teamId)
    throw error
  }
}

async function refreshTeam(db: NonNullable<typeof supabase>, record: OeRecord, teamId: string) {
  const { error } = await db
    .from('competition_form_submissions')
    .update(submissionRow(record, teamId))
    .eq('source_key', record.sourceKey)
  if (error) throw new Error(`form submission: ${error.message}`)

  for (const m of record.members) {
    const { error: memberError } = await db
      .from('competition_team_members')
      .update({ name: m.name, institution: record.school, ...(m.role === 'leader' ? { phone: record.leaderPhone } : {}) })
      .eq('team_id', teamId)
      .eq('slot', m.slot)
      .is('user_id', null)
    if (memberError) throw new Error(`member ${m.slot}: ${memberError.message}`)
  }
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>) {
  let next = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) await worker(items[next++])
    }),
  )
}

await runPool(importable, async ({ record }) => {
  const teamId = existing.get(record.sourceKey)
  if (!supabase) return void outcomes.set(record.row, { outcome: 'not-checked' })
  if (!apply) return void outcomes.set(record.row, { outcome: teamId ? 'would-update' : 'would-create' })

  try {
    if (teamId) await refreshTeam(supabase, record, teamId)
    else await createTeam(supabase, record)
    outcomes.set(record.row, { outcome: teamId ? 'updated' : 'created' })
  } catch (error) {
    outcomes.set(record.row, { outcome: 'failed', error: error instanceof Error ? error.message : String(error) })
  }
  if (outcomes.size % 50 === 0) console.log(`  … ${outcomes.size}/${importable.length}`)
})

// ── Report ──────────────────────────────────────────────────────────────────────────────────
const count = <T>(values: T[]) => values.reduce((map, v) => map.set(v, (map.get(v) ?? 0) + 1), new Map<T, number>())
const issueCounts = count(sheet.rows.flatMap((row) => row.issues.map((issue) => `${issue.level}:${issue.code}`)))
const outcomeCounts = count([...outcomes.values()].map((o) => o.outcome))
const tierCounts = count(importable.map((row) => `${row.record.feeTier.key} Rp${row.record.feeTier.amount}`))

console.log(`\n${apply ? 'APPLY' : 'DRY RUN'} — ${file}`)
console.log(`Rows with data: ${sheet.rows.length} (empty rows skipped: ${sheet.emptyRows})`)
console.log(`Importable: ${importable.length}   Rejected (errors): ${rejected.length}`)
console.log('Fee tiers:', Object.fromEntries(tierCounts))
console.log('Issues:', Object.fromEntries([...issueCounts].sort()))
console.log(supabase ? `Database: ${JSON.stringify(Object.fromEntries(outcomeCounts))}` : 'Database: not checked (no Supabase env)')

for (const row of rejected) {
  console.log(`  ✗ row ${row.row} "${row.teamName}": ${row.issues.filter((i) => i.level === 'error').map((i) => `${i.code}${i.field ? `(${i.field})` : ''}${i.detail ? ` ${i.detail}` : ''}`).join(', ')}`)
}
for (const [row, outcome] of outcomes) {
  if (outcome.outcome === 'failed') console.log(`  ✗ row ${row} write failed: ${outcome.error}`)
}

mkdirSync(dirname(reportPath), { recursive: true })
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      mode: apply ? 'apply' : 'dry-run',
      file,
      generatedAt: new Date().toISOString(),
      summary: {
        rows: sheet.rows.length,
        emptyRows: sheet.emptyRows,
        importable: importable.length,
        rejected: rejected.length,
        issues: Object.fromEntries(issueCounts),
        database: Object.fromEntries(outcomeCounts),
      },
      rows: sheet.rows.map((row) => ({
        row: row.row,
        teamName: row.teamName,
        outcome: outcomes.get(row.row)?.outcome ?? 'rejected',
        error: outcomes.get(row.row)?.error,
        issues: row.issues,
      })),
    },
    null,
    2,
  ),
)
console.log(`\nReport: ${reportPath}`)
if ([...outcomes.values()].some((o) => o.outcome === 'failed')) process.exit(1)
