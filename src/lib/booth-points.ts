import { type ProfileRoleA, type ProfileRoleB } from '@/lib/types/database'

/*
  Booth points: rules shared by the scanner UI (/admin/booth) and POST /api/booth-points/scan.
  Client-safe: no server imports.

  Who can award (boothAccessFor):
    - admins: every booth;
    - role_b 'booth' opens the Booth section for staff and stakeholders. Which booths:
        stakeholder -> every booth ('all'), automatically;
        staff       -> profiles.role_c: 'all' = every booth, otherwise a booth type
                       (comma-separated for several). Staff with no role_c see the section but
                       have no booth to award at yet.

  What a visitor can get at one booth (planBoothAward): two options, each at most once.
    - Contribution: CONTRIBUTION_POINTS, for being active at the booth.
    - Bonus:        BONUS_POINTS on top, and the Contribution too if it was not given yet.
  After a Bonus nothing is left at that booth; after a Contribution only the Bonus is.

  PRACTICE: nothing is written yet. The booths are mocks (MOCK_BOOTHS), the API confirms the
  scan reached the server but adds no points, and the scanner remembers what was given in this
  browser only. Going live = real booths + reading/writing booth_scan_events instead of the
  client's `given`, then set BOOTH_POINTS_PRACTICE to false.
*/

export const BOOTH_POINTS_PRACTICE = true

// Fixed amounts. PLACEHOLDERS: set the real numbers here.
export const CONTRIBUTION_POINTS = 10
export const BONUS_POINTS = 5

export type BoothPointOption = 'contribution' | 'bonus'
export const BOOTH_POINT_OPTIONS: readonly BoothPointOption[] = ['contribution', 'bonus']

export type GivenOptions = { contribution: boolean; bonus: boolean }
export const NOTHING_GIVEN: GivenOptions = { contribution: false, bonus: false }

export type AwardPlan = { option: BoothPointOption; contribution: number; bonus: number; total: number }

/** What choosing `option` gives a visitor who already has `given` at this booth; null = already used. */
export function planBoothAward(given: GivenOptions, option: BoothPointOption): AwardPlan | null {
  // A Bonus always came with the Contribution, so after a Bonus there is nothing left.
  const contributionGiven = given.contribution || given.bonus
  if (option === 'contribution') {
    if (contributionGiven) return null
    return { option, contribution: CONTRIBUTION_POINTS, bonus: 0, total: CONTRIBUTION_POINTS }
  }
  if (given.bonus) return null
  const contribution = contributionGiven ? 0 : CONTRIBUTION_POINTS
  return { option, contribution, bonus: BONUS_POINTS, total: contribution + BONUS_POINTS }
}

export function markGiven(given: GivenOptions, option: BoothPointOption): GivenOptions {
  return option === 'bonus' ? { contribution: true, bonus: true } : { ...given, contribution: true }
}

// ---- booths ------------------------------------------------------------------------------------

export type PracticeBooth = { id: string; name: string; type: string }

/** Mock booths until the real list is in the booths table. `type` is what role_c can name. */
export const MOCK_BOOTHS: readonly PracticeBooth[] = [
  { id: 'mock-drone-showcase', name: 'Drone Showcase', type: 'showcase' },
  { id: 'mock-nusantara-teknologi', name: 'Booth Nusantara Teknologi', type: 'exhibitor' },
  { id: 'mock-booth-1a', name: 'Booth 1A', type: 'exhibitor' },
  { id: 'mock-booth-1b', name: 'Booth 1B', type: 'exhibitor' },
  { id: 'mock-booth-2a', name: 'Booth 2A', type: 'exhibitor' },
  { id: 'mock-photobooth', name: 'Photobooth Utama', type: 'photobooth' },
]

/** 'all' = every booth; otherwise the booth types (role_c) this person may award at. */
export type BoothScope = 'all' | readonly string[]

export function boothsInScope(scope: BoothScope, booths: readonly PracticeBooth[] = MOCK_BOOTHS): PracticeBooth[] {
  if (scope === 'all') return [...booths]
  return booths.filter((booth) => scope.includes(booth.type))
}

// ---- access ------------------------------------------------------------------------------------

export type BoothAccess = { scope: BoothScope }

export function boothAccessFor(params: {
  isAdmin: boolean
  roleA: ProfileRoleA | null | undefined
  roleB: ProfileRoleB | null | undefined
  roleC: string | null | undefined
}): BoothAccess | null {
  if (params.isAdmin) return { scope: 'all' }
  if (params.roleB !== 'booth') return null
  if (params.roleA === 'stakeholder') return { scope: 'all' }
  if (params.roleA !== 'staff') return null

  const roleC = params.roleC?.trim()
  if (!roleC) return { scope: [] }
  if (roleC === 'all') return { scope: 'all' }
  return {
    scope: roleC
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  }
}
