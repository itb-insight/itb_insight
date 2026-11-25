// Resolves an AudienceFilter into a de-duplicated recipient list (server-only, service role).
// The filter is validated by parseAudienceFilter first; values reach PostgREST only through
// .eq()/.in()/.is(), never through filter strings.
//
// Enriches recipients from competition registrations/teams with formatted-string variables
// (`team_name`, `team_uid`, `competition`, `institution`) and supports targeting unclaimed
// shadow members (`competition_team_members` where `user_id IS NULL` and `claim_email` is set)
// as well as per-recipient variable overrides via `customRecipients`.

import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'

import { hasCriteria, isValidEmail, normalizeEmail, type AudienceFilter } from './audience'

export const MAX_RECIPIENTS = 5000

const PAGE = 1000
const CHUNK = 100

export type Recipient = {
  userId: string | null
  email: string
  name: string | null
  variables: Record<string, string>
}

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

type RegistrantHit = {
  userIds: Set<string>
  userVars: Map<string, Record<string, string>>
  shadowRecipients: Recipient[]
}

async function resolveCompetitionHits(filter: AudienceFilter): Promise<RegistrantHit> {
  const db = createServiceClient()
  const userIds = new Set<string>()
  const userVars = new Map<string, Record<string, string>>()
  const shadowRecipients: Recipient[] = []

  const setVars = (userId: string, vars: Record<string, string>) => {
    const prev = userVars.get(userId) ?? {}
    userVars.set(userId, { ...vars, ...prev })
  }

  let competitionById: Map<string, string> | null = null
  if (filter.competitionSlugs?.length) {
    const { data, error } = await db.from('competitions').select('id, name').in('slug', filter.competitionSlugs)
    if (error) throw new Error('query failed')
    const rows = (data as Row[] | null) ?? []
    competitionById = new Map(rows.map((r) => [r.id as string, (r.name as string) || '']))
    if (competitionById.size === 0) return { userIds, userVars, shadowRecipients }
  }

  const registrations = await fetchAll((from, to) => {
    let query = db
      .from('competition_registrations')
      .select('id, competition_id, user_id, team_id, competitions(name), competition_teams(id, team_uid, team_name, source), payments(status)')
      .order('id')
    if (competitionById) query = query.in('competition_id', [...competitionById.keys()])
    if (filter.registrationStatus?.length) query = query.in('status', filter.registrationStatus)
    return query.range(from, to)
  })

  const wantedPayments = filter.paymentStatus
  const wantedSources = filter.teamSources

  const matchesPayment = (row: Row) => {
    if (!wantedPayments?.length) return true
    const payments = Array.isArray(row.payments) ? (row.payments as Row[]) : row.payments ? [row.payments as Row] : []
    const statuses = payments.map((payment) => payment.status as string)
    return wantedPayments.some((status) =>
      status === 'unpaid' ? !statuses.includes('paid') : statuses.includes(status),
    )
  }

  const teamMeta = new Map<string, { teamName: string; teamUid: string; competitionName: string }>()

  for (const row of registrations.filter(matchesPayment)) {
    const compObj = Array.isArray(row.competitions) ? row.competitions[0] : row.competitions
    const compName =
      (compObj as Row | null)?.name
        ? String((compObj as Row).name)
        : competitionById?.get(row.competition_id as string) ?? ''

    const teamObj = (Array.isArray(row.competition_teams) ? row.competition_teams[0] : row.competition_teams) as Row | null
    if (wantedSources?.length) {
      const src = (teamObj?.source as string | undefined) ?? 'web'
      if (!wantedSources.includes(src as never)) continue
    }

    if (typeof row.user_id === 'string' && !filter.shadowOnly) {
      userIds.add(row.user_id)
      if (compName) setVars(row.user_id, { competition: compName })
    }

    if (typeof row.team_id === 'string') {
      teamMeta.set(row.team_id, {
        teamName: typeof teamObj?.team_name === 'string' ? teamObj.team_name : '',
        teamUid: typeof teamObj?.team_uid === 'string' ? teamObj.team_uid : '',
        competitionName: compName,
      })
    }
  }

  // If shadowOnly or teamSources was requested without registration rows (e.g. direct team import check)
  if (teamMeta.size === 0 && (filter.shadowOnly || filter.teamSources?.length) && !filter.registrationStatus?.length && !filter.paymentStatus?.length) {
    const teams = await fetchAll((from, to) => {
      let query = db.from('competition_teams').select('id, team_uid, team_name, source, competition_id, competitions(name)').order('id')
      if (competitionById) query = query.in('competition_id', [...competitionById.keys()])
      if (wantedSources?.length) query = query.in('source', wantedSources)
      return query.range(from, to)
    })
    for (const t of teams) {
      const compObj = Array.isArray(t.competitions) ? t.competitions[0] : t.competitions
      const compName =
        (compObj as Row | null)?.name
          ? String((compObj as Row).name)
          : competitionById?.get(t.competition_id as string) ?? ''
      teamMeta.set(t.id as string, {
        teamName: typeof t.team_name === 'string' ? t.team_name : '',
        teamUid: typeof t.team_uid === 'string' ? t.team_uid : '',
        competitionName: compName,
      })
    }
  }

  const wantShadow = Boolean(filter.shadowOnly || filter.includeShadowSlots)

  for (const ids of chunked([...teamMeta.keys()], CHUNK)) {
    const members = await fetchAll((from, to) =>
      db
        .from('competition_team_members')
        .select('id, team_id, user_id, name, email, claim_email, institution, member_role, status')
        .in('team_id', ids)
        .order('id')
        .range(from, to),
    )

    for (const member of members) {
      if (member.status === 'withdrawn') continue
      const meta = teamMeta.get(member.team_id as string)
      const vars: Record<string, string> = {}
      if (meta?.teamName) vars.team_name = meta.teamName
      if (meta?.teamUid) vars.team_uid = meta.teamUid
      if (meta?.competitionName) vars.competition = meta.competitionName
      if (typeof member.institution === 'string' && member.institution) vars.institution = member.institution
      if (typeof member.member_role === 'string' && member.member_role) vars.member_role = member.member_role

      if (typeof member.user_id === 'string') {
        if (!filter.shadowOnly) {
          userIds.add(member.user_id)
          setVars(member.user_id, vars)
        }
      } else if (wantShadow) {
        const rawEmail =
          typeof member.claim_email === 'string' && member.claim_email
            ? member.claim_email
            : typeof member.email === 'string'
              ? member.email
              : ''
        const email = normalizeEmail(rawEmail)
        if (isValidEmail(email)) {
          shadowRecipients.push({
            userId: null,
            email,
            name: typeof member.name === 'string' && member.name ? member.name : null,
            variables: vars,
          })
        }
      }
    }
  }

  return { userIds, userVars, shadowRecipients }
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
      filter.competitionSlugs?.length ||
        filter.registrationStatus?.length ||
        filter.paymentStatus?.length ||
        filter.teamSources?.length ||
        filter.shadowOnly ||
        filter.includeShadowSlots,
    )

    let include: Set<string> | null = null
    let exclude: Set<string> | null = null
    let userVars = new Map<string, Record<string, string>>()
    let shadowRecipients: Recipient[] = []

    if (usesRegistrations) {
      const hits = await resolveCompetitionHits(filter)
      include = hits.userIds
      userVars = hits.userVars
      shadowRecipients = hits.shadowRecipients
    }

    if (filter.checkedIn !== undefined) {
      const checkedIn = await checkedInUserIds()
      if (filter.checkedIn) {
        include = include ? new Set([...include].filter((id) => checkedIn.has(id))) : checkedIn
      } else {
        exclude = checkedIn
      }
    }

    const hasAccountCriteria =
      !filter.shadowOnly &&
      Boolean(filter.allUsers || usesRegistrations || filter.checkedIn !== undefined || filter.roleA?.length)

    const byEmail = new Map<string, Recipient>()
    const upsert = (incoming: Recipient, overrideExisting: boolean) => {
      const existing = byEmail.get(incoming.email)
      if (!existing) {
        byEmail.set(incoming.email, incoming)
        return
      }
      if (overrideExisting) {
        byEmail.set(incoming.email, {
          userId: incoming.userId ?? existing.userId,
          email: existing.email,
          name: incoming.name ?? existing.name,
          variables: { ...existing.variables, ...incoming.variables },
        })
      } else {
        byEmail.set(incoming.email, {
          ...existing,
          name: existing.name ?? incoming.name,
          variables: { ...incoming.variables, ...existing.variables },
        })
      }
    }

    if (hasAccountCriteria) {
      const profileQuery = (from: number, to: number, ids?: string[]) => {
        let query = db.from('profiles').select('id, full_name, email, institution').order('id')
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
        const id = profile.id as string
        if (exclude?.has(id)) continue
        const email = normalizeEmail(typeof profile.email === 'string' ? profile.email : '')
        if (!isValidEmail(email)) continue
        const vars: Record<string, string> = { ...(userVars.get(id) ?? {}) }
        if (typeof profile.institution === 'string' && profile.institution && !vars.institution) {
          vars.institution = profile.institution
        }
        upsert(
          {
            userId: id,
            email,
            name: (profile.full_name as string | null) ?? null,
            variables: vars,
          },
          false,
        )
      }
    }

    // Add unclaimed shadow slot recipients when requested (unless checkedIn=true excluded non-accounts)
    if (shadowRecipients.length > 0 && filter.checkedIn !== true) {
      for (const shadow of shadowRecipients) {
        upsert(shadow, false)
      }
    }

    const invalidManualEmails: string[] = []
    for (const raw of filter.manualEmails ?? []) {
      const email = normalizeEmail(raw)
      if (isValidEmail(email)) upsert({ userId: null, email, name: null, variables: {} }, false)
      else invalidManualEmails.push(raw)
    }

    for (const custom of filter.customRecipients ?? []) {
      const email = normalizeEmail(custom.email)
      if (isValidEmail(email)) {
        upsert(
          {
            userId: null,
            email,
            name: custom.name ?? null,
            variables: custom.variables ?? {},
          },
          true,
        )
      } else {
        invalidManualEmails.push(custom.email)
      }
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
