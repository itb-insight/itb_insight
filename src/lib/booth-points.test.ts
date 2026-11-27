import { describe, expect, it } from 'vitest'

import {
  BONUS_POINTS,
  CONTRIBUTION_POINTS,
  MOCK_BOOTHS,
  NOTHING_GIVEN,
  boothAccessFor,
  boothsInScope,
  markGiven,
  planBoothAward,
} from '@/lib/booth-points'

describe('planBoothAward', () => {
  it('gives the Contribution once', () => {
    expect(planBoothAward(NOTHING_GIVEN, 'contribution')).toEqual({
      option: 'contribution',
      contribution: CONTRIBUTION_POINTS,
      bonus: 0,
      total: CONTRIBUTION_POINTS,
    })
    const after = markGiven(NOTHING_GIVEN, 'contribution')
    expect(planBoothAward(after, 'contribution')).toBeNull()
  })

  it('a Bonus first also grants the Contribution, then nothing is left', () => {
    expect(planBoothAward(NOTHING_GIVEN, 'bonus')).toEqual({
      option: 'bonus',
      contribution: CONTRIBUTION_POINTS,
      bonus: BONUS_POINTS,
      total: CONTRIBUTION_POINTS + BONUS_POINTS,
    })
    const after = markGiven(NOTHING_GIVEN, 'bonus')
    expect(after).toEqual({ contribution: true, bonus: true })
    expect(planBoothAward(after, 'bonus')).toBeNull()
    expect(planBoothAward(after, 'contribution')).toBeNull()
  })

  it('a Bonus after the Contribution adds the bonus only', () => {
    const after = markGiven(NOTHING_GIVEN, 'contribution')
    expect(planBoothAward(after, 'bonus')).toEqual({ option: 'bonus', contribution: 0, bonus: BONUS_POINTS, total: BONUS_POINTS })
  })

  it('treats a bonus-only record as Contribution given too', () => {
    expect(planBoothAward({ contribution: false, bonus: true }, 'contribution')).toBeNull()
  })
})

describe('boothAccessFor', () => {
  const base = { isAdmin: false, roleA: null, roleB: null, roleC: null } as const

  it('admins get every booth', () => {
    expect(boothAccessFor({ ...base, isAdmin: true })).toEqual({ scope: 'all' })
  })

  it('stakeholders of booth get every booth, whatever role_c says', () => {
    expect(boothAccessFor({ ...base, roleA: 'stakeholder', roleB: 'booth' })).toEqual({ scope: 'all' })
  })

  it('booth staff get the booths in role_c', () => {
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'booth', roleC: 'all' })).toEqual({ scope: 'all' })
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'booth', roleC: 'exhibitor, showcase' })).toEqual({
      scope: ['exhibitor', 'showcase'],
    })
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'booth' })).toEqual({ scope: [] })
  })

  it('no booth access without role_b booth', () => {
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'webdev', roleC: 'all' })).toBeNull()
    expect(boothAccessFor({ ...base, roleA: 'stakeholder' })).toBeNull()
    expect(boothAccessFor({ ...base, roleA: 'sponsor_partner', roleB: 'booth' })).toBeNull()
    expect(boothAccessFor(base)).toBeNull()
  })
})

describe('boothsInScope', () => {
  it("'all' is every booth, a type list filters by booth type", () => {
    expect(boothsInScope('all')).toHaveLength(MOCK_BOOTHS.length)
    expect(boothsInScope(['showcase']).map((b) => b.id)).toEqual(['mock-drone-showcase'])
    expect(boothsInScope([])).toEqual([])
  })
})
