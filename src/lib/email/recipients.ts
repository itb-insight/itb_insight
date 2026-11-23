// Resolves an AudienceFilter into a de-duplicated recipient list (server-only, service role).
// The filter is validated by parseAudienceFilter first; values reach PostgREST only through
// .eq()/.in(), never through filter strings.

import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'

import { hasCriteria, isValidEmail, normalizeEmail, type AudienceFilter } from './audience'

export const MAX_RECIPIENTS = 5000

const PAGE = 1000
const CHUNK = 100

export type Recipient = { userId: string | null; email: string; name: string | null }

export type RecipientResolution =
  | { ok: true; recipients: Recipient[]; invalidManualEmails: string[] }
  | { ok: false; code: 'EMPTY_FILTER' | 'TOO_MANY_RECIPIENTS' | 'DATABASE_ERROR'; message: string }

type Row = Record<string, unknown>

function chunked<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

// PostgREST caps a response at 1000 rows: page through with a stable order.
async function fetchAll(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw new Error('query failed')
    const page = (data as Row[] | null) ?? []
    rows.push(...page)
    if (page.length < PAGE) break
  }
  return rows
}

async function registrantUserIds(filter: AudienceFilter): Promise<Set<string>> {
  const db = createServiceClient()
  const userIds = new Set<string>()

  let competitionIds: string[] | null = null
  if (filter.competitionSlugs?.length) {
    const { data, error } = await db.from('competitions').select('id').in('slug', filter.competitionSlugs)
    if (error) throw new Error('query failed')
    competitionIds = ((data as Row[] | null) ?? []).map((row) => row.id as string)
    if (competitionIds.length === 0) return userIds
  }

  const registrations = await fetchAll((from, to) => {
    let query = db.from('competition_registrations').select('id, user_id, team_id, payments(status)').order('id')
    if (competitionIds) query = query.in('competition_id', competitionIds)
    if (filter.registrationStatus?.length) query = query.in('status', filter.registrationStatus)
    return query.range(from, to)
  })

  const wanted = filter.paymentStatus
  const matchesPayment = (row: Row) => {
    if (!wanted?.length) return true
    const payments = Array.isArray(row.payments) ? (row.payments as Row[]) : row.payments ? [row.payments as Row] : []
    const statuses = payments.map((payment) => payment.status as string)
    return wanted.some((status) => (status === 'unpaid' ? !statuses.includes('paid') : statuses.includes(status)))
  }

  const teamIds: string[] = []
  for (const row of registrations.filter(matchesPayment)) {
    if (typeof row.user_id === 'string') userIds.add(row.user_id)
    if (typeof row.team_id === 'string') teamIds.push(row.team_id)
  }

  for (const ids of chunked([...new Set(teamIds)], CHUNK)) {
    const members = await fetchAll((from, to) =>
      db.from('competition_team_members').select('id, user_id').in('team_id', ids).order('id').range(from, to),
    )
    for (const member of members) if (typeof member.user_id === 'string') userIds.add(member.user_id)
  }

  return userIds
}

async function checkedInUserIds(): Promise<Set<string>> {
  const db = createServiceClient()
  const rows = await fetchAll((from, to) =>
    db.from('visitor_tickets').select('id, user_id').eq('checked_in', true).order('id').range(from, to),
  )
  return new Set(rows.map((row) => row.user_id as string))
}

export async function resolveRecipients(filter: AudienceFilter): Promise<RecipientResolution> {
  if (!hasCriteria(filter)) {
    return { ok: false, code: 'EMPTY_FILTER', message: 'Pilih minimal satu filter penerima.' }
  }

  try {
    const db = createServiceClient()
    const usesRegistrations = Boolean(
      filter.competitionSlugs?.length || filter.registrationStatus?.length || filter.paymentStatus?.length,
    )

    // include: only these accounts (null = no restriction); exclude: never these accounts.
    let include: Set<string> | null = null
    let exclude: Set<string> | null = null

    if (usesRegistrations) include = await registrantUserIds(filter)
    if (filter.checkedIn !== undefined) {
      const checkedIn = await checkedInUserIds()
      if (filter.checkedIn) {
        include = include ? new Set([...include].filter((id) => checkedIn.has(id))) : checkedIn
      } else {
        exclude = checkedIn
      }
    }

    const hasAccountCriteria = Boolean(
      filter.allUsers || usesRegistrations || filter.checkedIn !== undefined || filter.roleA?.length,
    )

    const byEmail = new Map<string, Recipient>()
    const add = (recipient: Recipient) => {
      if (!byEmail.has(recipient.email)) byEmail.set(recipient.email, recipient)
    }

    if (hasAccountCriteria) {
      const profileQuery = (from: number, to: number, ids?: string[]) => {
        let query = db.from('profiles').select('id, full_name, email').order('id')
        if (ids) query = query.in('id', ids)
        if (filter.roleA?.length) query = query.in('role_a', filter.roleA)
        return query.range(from, to)
      }

      let profiles: Row[]
      if (include) {
        profiles = []
        for (const ids of chunked([...include], CHUNK)) {
          profiles.push(...(await fetchAll((from, to) => profileQuery(from, to, ids))))
        }
      } else {
        profiles = await fetchAll((from, to) => profileQuery(from, to))
      }

      for (const profile of profiles) {
        if (exclude?.has(profile.id as string)) continue
        const email = normalizeEmail(typeof profile.email === 'string' ? profile.email : '')
        if (!isValidEmail(email)) continue
        add({ userId: profile.id as string, email, name: (profile.full_name as string | null) ?? null })
      }
    }

    const invalidManualEmails: string[] = []
    for (const raw of filter.manualEmails ?? []) {
      const email = normalizeEmail(raw)
      if (isValidEmail(email)) add({ userId: null, email, name: null })
      else invalidManualEmails.push(raw)
    }

    const recipients = [...byEmail.values()]
    if (recipients.length > MAX_RECIPIENTS) {
      return {
        ok: false,
        code: 'TOO_MANY_RECIPIENTS',
        message: `Penerima (${recipients.length}) melebihi batas ${MAX_RECIPIENTS} per kampanye. Persempit filter atau bagi kampanye.`,
      }
    }

    return { ok: true, recipients, invalidManualEmails }
  } catch (err) {
    console.error('[Email Recipients Error]', err)
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal menentukan penerima.' }
  }
}
