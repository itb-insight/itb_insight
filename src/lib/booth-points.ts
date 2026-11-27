import { type ProfileRoleA, type ProfileRoleB } from '@/lib/types/database'

/*
  Booth points: rules shared by the scanner UI (/admin/booth), POST /api/booth-points/scan and the
  booth access page (/admin/booth-access). Client-safe: no server imports. Data access:
  src/lib/booth-roster.ts.

  Booths (migration 0029): public.booths, grouped by category = the event they belong to
  (BOOTH_CATEGORIES). Each booth sets its own amounts: booths.points is the Contribution,
  booths.max_bonus_points the Bonus.

  Who can award where (boothAccessFor):
    - every booth: admins; stakeholders with role_b 'booth' (the "special roles"); staff with
      role_b 'booth' and role_c 'all';
    - otherwise the booths assigned to the account's verified email in booth_staff_assignments
      (0029). Stakeholders with role_b 'booth' and admins manage those at /admin/booth-access
      (canManageBoothAccess);
    - staff with role_b 'booth' and no assignment see the section but have no booth yet.

  What a visitor can get at one booth (planBoothAward): two options, each at most once.
    - Contribution: the booth's contribution, for being active at the booth.
    - Bonus:        the booth's bonus on top, and the Contribution too if it was not given yet.
  After a Bonus nothing is left at that booth; after a Contribution only the Bonus is.

  PRACTICE: nothing is written yet. The API confirms the scan reached the server but adds no
  points, and the scanner remembers what was given in this browser only. Going live = reading and
  writing booth_scan_events instead of the client's `given`, then set BOOTH_POINTS_PRACTICE to false.
*/

export const BOOTH_POINTS_PRACTICE = true

/**
 * Example amounts for the gate demo (src/features/gate/GateScanner.tsx), which shows visitors what
 * a booth scan looks like. Most booths give 5 + 5; the real amounts are per booth (booths table).
 */
export const CONTRIBUTION_POINTS = 5
export const BONUS_POINTS = 5

export type BoothPointOption = 'contribution' | 'bonus'
export const BOOTH_POINT_OPTIONS: readonly BoothPointOption[] = ['contribution', 'bonus']

export type GivenOptions = { contribution: boolean; bonus: boolean }
export const NOTHING_GIVEN: GivenOptions = { contribution: false, bonus: false }

export type AwardPlan = { option: BoothPointOption; contribution: number; bonus: number; total: number }

/** What a booth gives: booths.points (contribution) and booths.max_bonus_points (bonus). */
export type BoothAmounts = { contribution: number; bonus: number }

/** What choosing `option` gives a visitor who already has `given` at this booth; null = already used. */
export function planBoothAward(given: GivenOptions, option: BoothPointOption, amounts: BoothAmounts): AwardPlan | null {
  // A Bonus always came with the Contribution, so after a Bonus there is nothing left.
  const contributionGiven = given.contribution || given.bonus
  if (option === 'contribution') {
    if (contributionGiven) return null
    return { option, contribution: amounts.contribution, bonus: 0, total: amounts.contribution }
  }
  if (given.bonus) return null
  const contribution = contributionGiven ? 0 : amounts.contribution
  return { option, contribution, bonus: amounts.bonus, total: contribution + amounts.bonus }
}

export function markGiven(given: GivenOptions, option: BoothPointOption): GivenOptions {
  return option === 'bonus' ? { contribution: true, bonus: true } : { ...given, contribution: true }
}

// ---- booths ------------------------------------------------------------------------------------

/** A booth as the scanner and the access page see it. */
export type PointsBooth = BoothAmounts & {
  id: string
  slug: string
  name: string
  /** booths.category: one of BOOTH_CATEGORIES, or another value for booths added later. */
  category: string
}

/** The events with booths, in the order the scanner lists them. The ids are the event slugs. */
export const BOOTH_CATEGORIES = [
  { id: 'tech-xhibition', label: 'Tech-Xhibition' },
  { id: 'play-tech', label: 'Play-Tech' },
  { id: 'show-tech', label: 'Show-Tech' },
] as const

export function boothCategoryLabel(category: string): string {
  return BOOTH_CATEGORIES.find((c) => c.id === category)?.label ?? category
}

/** Booths grouped by category, in BOOTH_CATEGORIES order (other categories after). Keeps booth order. */
export function groupBoothsByCategory<T extends { category: string }>(
  booths: readonly T[],
): Array<{ category: string; label: string; booths: T[] }> {
  const known: readonly string[] = BOOTH_CATEGORIES.map((c) => c.id)
  const order = [...known, ...new Set(booths.map((b) => b.category).filter((c) => !known.includes(c)))]
  return order
    .map((category) => ({
      category,
      label: boothCategoryLabel(category),
      booths: booths.filter((b) => b.category === category),
    }))
    .filter((group) => group.booths.length > 0)
}

/** 'all' = every booth; otherwise the ids of the booths this person may award at. */
export type BoothScope = 'all' | readonly string[]

export function boothsInScope<T extends { id: string }>(scope: BoothScope, booths: readonly T[]): T[] {
  if (scope === 'all') return [...booths]
  return booths.filter((booth) => scope.includes(booth.id))
}

// ---- access ------------------------------------------------------------------------------------

export type BoothAccess = { scope: BoothScope }

type BoothRoles = {
  isAdmin: boolean
  roleA: ProfileRoleA | null | undefined
  roleB: ProfileRoleB | null | undefined
  roleC: string | null | undefined
}

export function boothAccessFor(
  params: BoothRoles & {
    /** Booths assigned to the account's verified email (booth_staff_assignments). */
    assignedBoothIds?: readonly string[]
  },
): BoothAccess | null {
  if (params.isAdmin) return { scope: 'all' }

  const boothRole = params.roleB === 'booth'
  if (boothRole && params.roleA === 'stakeholder') return { scope: 'all' }
  if (boothRole && params.roleA === 'staff' && params.roleC?.trim() === 'all') return { scope: 'all' }

  const assigned = [...new Set(params.assignedBoothIds ?? [])]
  if (assigned.length > 0) return { scope: assigned }
  if (boothRole && params.roleA === 'staff') return { scope: [] }
  return null
}

/** Who may add and remove booth assignments (/admin/booth-access): admins and booth stakeholders. */
export function canManageBoothAccess(params: Omit<BoothRoles, 'roleC'>): boolean {
  return params.isAdmin || (params.roleA === 'stakeholder' && params.roleB === 'booth')
}

/** Loose shape check for an email typed into the access page; the server normalises it. */
export const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
