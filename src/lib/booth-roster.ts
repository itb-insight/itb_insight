import 'server-only'

import { type User } from '@supabase/supabase-js'

import { EMAIL_PATTERN, normalizeEmail, type BoothScope, type PointsBooth } from '@/lib/booth-points'
import { UUID_PATTERN } from '@/lib/input'
import { createServiceClient } from '@/lib/supabase/server'
import { type ProfileRoleA } from '@/lib/types/database'

/*
  Booths and booth staff assignments (migration 0029). Rules: src/lib/booth-points.ts.

  booth_staff_assignments is keyed by email so a booth can be assigned before the account exists.
  It only counts for a verified email: anyone can request a sign-in code for any address, which
  creates an unverified auth user (same rule as profile_role_grants, 0019).
  Revoking sets revoked_at / revoked_by and never deletes, so the table is also the change log.
*/

const BOOTH_COLUMNS = 'id, slug, name, category, points, max_bonus_points'

type BoothRow = { id: string; slug: string; name: string; category: string; points: number; max_bonus_points: number }

function toPointsBooth(row: BoothRow): PointsBooth {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    contribution: row.points,
    bonus: row.max_bonus_points,
  }
}

/** Active booths in this scope, by category then slug (= layout number). Throws on a read error. */
export async function loadBoothsInScope(scope: BoothScope): Promise<PointsBooth[]> {
  if (scope !== 'all' && scope.length === 0) return []
  let query = createServiceClient().from('booths').select(BOOTH_COLUMNS).eq('is_active', true)
  if (scope !== 'all') query = query.in('id', [...scope])
  const { data, error } = await query.order('category', { ascending: true }).order('slug', { ascending: true })
  if (error) throw new Error(`booths: ${error.message}`)
  return ((data ?? []) as BoothRow[]).map(toPointsBooth)
}

/** The active booth `boothId` if this scope may award there, else null. Throws on a read error. */
export async function findBoothInScope(scope: BoothScope, boothId: string): Promise<PointsBooth | null> {
  if (!UUID_PATTERN.test(boothId)) return null
  if (scope !== 'all' && !scope.includes(boothId)) return null
  const { data, error } = await createServiceClient()
    .from('booths')
    .select(BOOTH_COLUMNS)
    .eq('id', boothId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(`booths: ${error.message}`)
  return data ? toPointsBooth(data as BoothRow) : null
}

/** Booth ids assigned to this user's email; none unless the email is verified. Fails closed. */
export async function loadAssignedBoothIds(user: Pick<User, 'email' | 'email_confirmed_at'>): Promise<string[]> {
  if (!user.email || !user.email_confirmed_at) return []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  try {
    const { data, error } = await createServiceClient()
      .from('booth_staff_assignments')
      .select('booth_id')
      .eq('email', normalizeEmail(user.email))
      .is('revoked_at', null)
    if (error) {
      console.error('[booth-roster] assignment lookup failed', error)
      return []
    }
    return ((data ?? []) as Array<{ booth_id: string }>).map((row) => row.booth_id)
  } catch (err) {
    console.error('[booth-roster] assignment lookup failed', err)
    return []
  }
}

// ---- access page (/admin/booth-access) ---------------------------------------------------------

/** The profile behind an email, when one exists (display only). */
export type AssigneeProfile = { fullName: string; roleA: ProfileRoleA | null }

export type BoothAssignmentView = {
  id: string
  email: string
  boothId: string
  assignedAt: string
  /** null = added from the SQL editor (the grant file). */
  assignedByName: string | null
  profile: AssigneeProfile | null
}

/** Accounts that reach every booth through their profile role (not editable on the page). */
export type AllBoothsHolder = { fullName: string; email: string; reason: 'stakeholder' | 'staff_all' }

export type AssignmentChange = {
  key: string
  kind: 'assigned' | 'revoked'
  at: string
  email: string
  boothName: string
  byName: string | null
}

export type BoothAccessOverview = {
  booths: PointsBooth[]
  assignments: BoothAssignmentView[]
  allBooths: AllBoothsHolder[]
  history: AssignmentChange[]
}

const HISTORY_LIMIT = 60

type Named = { full_name?: string | null } | Array<{ full_name?: string | null }> | null | undefined

function nameOf(value: Named): string | null {
  const row = Array.isArray(value) ? value[0] : value
  return row?.full_name?.trim() || null
}

type AssignmentRow = {
  id: string
  email: string
  booth_id: string
  assigned_at: string
  revoked_at: string | null
  assigner?: Named
  revoker?: Named
}

const ASSIGNMENT_COLUMNS =
  'id, email, booth_id, assigned_at, revoked_at, ' +
  'assigner:profiles!booth_staff_assignments_assigned_by_fkey(full_name), ' +
  'revoker:profiles!booth_staff_assignments_revoked_by_fkey(full_name)'

/** Everything the access page shows. Throws on a read error. */
export async function loadBoothAccessOverview(): Promise<BoothAccessOverview> {
  const supabase = createServiceClient()
  const [booths, active, recentAssigned, recentRevoked, allBoothsRows] = await Promise.all([
    // Inactive booths too: their assignments and history still need a name.
    supabase.from('booths').select(`${BOOTH_COLUMNS}, is_active`).order('category').order('slug'),
    supabase.from('booth_staff_assignments').select(ASSIGNMENT_COLUMNS).is('revoked_at', null),
    supabase
      .from('booth_staff_assignments')
      .select(ASSIGNMENT_COLUMNS)
      .order('assigned_at', { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase
      .from('booth_staff_assignments')
      .select(ASSIGNMENT_COLUMNS)
      .not('revoked_at', 'is', null)
      .order('revoked_at', { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase
      .from('profiles')
      .select('full_name, email, role_a, role_c')
      .eq('role_b', 'booth')
      .in('role_a', ['stakeholder', 'staff']),
  ])

  for (const result of [booths, active, recentAssigned, recentRevoked, allBoothsRows]) {
    if (result.error) throw new Error(`booth access overview: ${result.error.message}`)
  }

  const boothRows = (booths.data ?? []) as Array<BoothRow & { is_active: boolean }>
  const boothName = new Map(boothRows.map((b) => [b.id, b.name]))
  const activeRows = (active.data ?? []) as unknown as AssignmentRow[]

  // Names for the assigned emails. Display only: access never comes from this match.
  const emails = [...new Set(activeRows.map((row) => row.email))]
  const profiles = new Map<string, AssigneeProfile>()
  if (emails.length > 0) {
    const { data, error } = await supabase.from('profiles').select('email, full_name, role_a').in('email', emails)
    if (error) throw new Error(`booth access overview: ${error.message}`)
    for (const row of (data ?? []) as Array<{ email: string; full_name: string | null; role_a: ProfileRoleA | null }>) {
      profiles.set(normalizeEmail(row.email), { fullName: row.full_name?.trim() || row.email, roleA: row.role_a })
    }
  }

  const assignments: BoothAssignmentView[] = activeRows.map((row) => ({
    id: row.id,
    email: row.email,
    boothId: row.booth_id,
    assignedAt: row.assigned_at,
    assignedByName: nameOf(row.assigner),
    profile: profiles.get(row.email) ?? null,
  }))

  const allBooths: AllBoothsHolder[] = (
    (allBoothsRows.data ?? []) as Array<{ full_name: string | null; email: string; role_a: ProfileRoleA; role_c: string | null }>
  )
    .filter((row) => row.role_a === 'stakeholder' || row.role_c === 'all')
    .map((row) => ({
      fullName: row.full_name?.trim() || row.email,
      email: row.email,
      reason: row.role_a === 'stakeholder' ? ('stakeholder' as const) : ('staff_all' as const),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))

  const changes: AssignmentChange[] = []
  for (const row of (recentAssigned.data ?? []) as unknown as AssignmentRow[]) {
    changes.push({
      key: `${row.id}:assigned`,
      kind: 'assigned',
      at: row.assigned_at,
      email: row.email,
      boothName: boothName.get(row.booth_id) ?? 'Booth',
      byName: nameOf(row.assigner),
    })
  }
  for (const row of (recentRevoked.data ?? []) as unknown as AssignmentRow[]) {
    if (!row.revoked_at) continue
    changes.push({
      key: `${row.id}:revoked`,
      kind: 'revoked',
      at: row.revoked_at,
      email: row.email,
      boothName: boothName.get(row.booth_id) ?? 'Booth',
      byName: nameOf(row.revoker),
    })
  }
  const history = changes.sort((a, b) => b.at.localeCompare(a.at)).slice(0, HISTORY_LIMIT)

  return {
    booths: boothRows.filter((b) => b.is_active).map(toPointsBooth),
    assignments,
    allBooths,
    history,
  }
}

// ---- changes -----------------------------------------------------------------------------------

export type AssignmentError = {
  ok: false
  code: 'INVALID_EMAIL' | 'INVALID_INPUT' | 'BOOTH_NOT_FOUND' | 'ALREADY_ASSIGNED' | 'NOT_FOUND' | 'DATABASE_ERROR'
  message: string
  status: 400 | 404 | 409 | 500
}

export type GrantResult = { ok: true; id: string; email: string; boothId: string; boothName: string } | AssignmentError

/** Assigns `boothId` to `email`, recorded as done by `actorId`. */
export async function grantBoothAssignment(params: { actorId: string; email: string; boothId: string }): Promise<GrantResult> {
  const email = normalizeEmail(params.email)
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, code: 'INVALID_EMAIL', message: 'Email tidak valid.', status: 400 }
  }
  if (!UUID_PATTERN.test(params.boothId)) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Booth tidak valid.', status: 400 }
  }

  const supabase = createServiceClient()
  const { data: booth, error: boothError } = await supabase
    .from('booths')
    .select('id, name')
    .eq('id', params.boothId)
    .eq('is_active', true)
    .maybeSingle()
  if (boothError) {
    console.error('[booth-roster] booth lookup failed', boothError)
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal membaca data booth.', status: 500 }
  }
  if (!booth) {
    return { ok: false, code: 'BOOTH_NOT_FOUND', message: 'Booth tidak ditemukan atau tidak aktif.', status: 404 }
  }

  const { data, error } = await supabase
    .from('booth_staff_assignments')
    .insert({ email, booth_id: booth.id, assigned_by: params.actorId })
    .select('id')
    .single()
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return { ok: false, code: 'ALREADY_ASSIGNED', message: `${email} sudah punya akses ke ${booth.name}.`, status: 409 }
    }
    console.error('[booth-roster] assignment insert failed', error)
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal menyimpan akses.', status: 500 }
  }

  return { ok: true, id: (data as { id: string }).id, email, boothId: booth.id as string, boothName: booth.name as string }
}

export type RevokeResult = { ok: true; id: string; email: string; boothId: string } | AssignmentError

/** Revokes a live assignment, recorded as done by `actorId`. The row stays as history. */
export async function revokeBoothAssignment(params: { actorId: string; assignmentId: string }): Promise<RevokeResult> {
  if (!UUID_PATTERN.test(params.assignmentId)) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Akses tidak valid.', status: 400 }
  }

  const { data, error } = await createServiceClient()
    .from('booth_staff_assignments')
    .update({ revoked_at: new Date().toISOString(), revoked_by: params.actorId })
    .eq('id', params.assignmentId)
    .is('revoked_at', null)
    .select('id, email, booth_id')
    .maybeSingle()
  if (error) {
    console.error('[booth-roster] assignment revoke failed', error)
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mencabut akses.', status: 500 }
  }
  if (!data) {
    return { ok: false, code: 'NOT_FOUND', message: 'Akses ini sudah dicabut atau tidak ada.', status: 404 }
  }

  const row = data as { id: string; email: string; booth_id: string }
  return { ok: true, id: row.id, email: row.email, boothId: row.booth_id }
}
