import { describe, expect, it } from 'vitest'

import {
  NOTHING_GIVEN,
  boothAccessFor,
  boothsInScope,
  canManageBoothAccess,
  groupBoothsByCategory,
  markGiven,
  planBoothAward,
} from '@/lib/booth-points'

const amounts = { contribution: 5, bonus: 5 }
const sponsor = { contribution: 10, bonus: 5 }

describe('planBoothAward', () => {
  it("gives the booth's Contribution once", () => {
    expect(planBoothAward(NOTHING_GIVEN, 'contribution', sponsor)).toEqual({
      option: 'contribution',
      contribution: 10,
      bonus: 0,
      total: 10,
    })
    const after = markGiven(NOTHING_GIVEN, 'contribution')
    expect(planBoothAward(after, 'contribution', sponsor)).toBeNull()
  })

  it('a Bonus first also grants the Contribution, then nothing is left', () => {
    expect(planBoothAward(NOTHING_GIVEN, 'bonus', sponsor)).toEqual({
      option: 'bonus',
      contribution: 10,
      bonus: 5,
      total: 15,
    })
    const after = markGiven(NOTHING_GIVEN, 'bonus')
    expect(after).toEqual({ contribution: true, bonus: true })
    expect(planBoothAward(after, 'bonus', amounts)).toBeNull()
    expect(planBoothAward(after, 'contribution', amounts)).toBeNull()
  })

  it('a Bonus after the Contribution adds the bonus only', () => {
    const after = markGiven(NOTHING_GIVEN, 'contribution')
    expect(planBoothAward(after, 'bonus', amounts)).toEqual({ option: 'bonus', contribution: 0, bonus: 5, total: 5 })
  })

  it('treats a bonus-only record as Contribution given too', () => {
    expect(planBoothAward({ contribution: false, bonus: true }, 'contribution', amounts)).toBeNull()
  })
})

describe('boothAccessFor', () => {
  const base = { isAdmin: false, roleA: null, roleB: null, roleC: null } as const

  it('admins get every booth', () => {
    expect(boothAccessFor({ ...base, isAdmin: true })).toEqual({ scope: 'all' })
  })

  it('stakeholders of booth get every booth, whatever is assigned', () => {
    expect(boothAccessFor({ ...base, roleA: 'stakeholder', roleB: 'booth' })).toEqual({ scope: 'all' })
    expect(boothAccessFor({ ...base, roleA: 'stakeholder', roleB: 'booth', assignedBoothIds: ['b1'] })).toEqual({
      scope: 'all',
    })
  })

  it("booth staff with role_c 'all' get every booth", () => {
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'booth', roleC: 'all' })).toEqual({ scope: 'all' })
  })

  it('everyone else gets the booths assigned to their email', () => {
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'booth', assignedBoothIds: ['b1', 'b2', 'b1'] })).toEqual({
      scope: ['b1', 'b2'],
    })
    // The assignment is the permission: no role_b 'booth' needed (e.g. a staff member of another division).
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'event', assignedBoothIds: ['b1'] })).toEqual({ scope: ['b1'] })
  })

  it('booth staff with nothing assigned see the section with no booth', () => {
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'booth' })).toEqual({ scope: [] })
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'booth', assignedBoothIds: [] })).toEqual({ scope: [] })
  })

  it('no booth access without a booth role or an assignment', () => {
    expect(boothAccessFor({ ...base, roleA: 'staff', roleB: 'event', roleC: 'all' })).toBeNull()
    expect(boothAccessFor({ ...base, roleA: 'stakeholder' })).toBeNull()
    expect(boothAccessFor({ ...base, roleA: 'sponsor_partner', roleB: 'booth' })).toBeNull()
    expect(boothAccessFor(base)).toBeNull()
  })
})

describe('canManageBoothAccess', () => {
  const base = { isAdmin: false, roleA: null, roleB: null } as const

  it('admins and booth stakeholders manage booth access', () => {
    expect(canManageBoothAccess({ ...base, isAdmin: true })).toBe(true)
    expect(canManageBoothAccess({ ...base, roleA: 'stakeholder', roleB: 'booth' })).toBe(true)
  })

  it('booth staff and other stakeholders do not', () => {
    expect(canManageBoothAccess({ ...base, roleA: 'staff', roleB: 'booth' })).toBe(false)
    expect(canManageBoothAccess({ ...base, roleA: 'stakeholder', roleB: 'event' })).toBe(false)
    expect(canManageBoothAccess(base)).toBe(false)
  })
})

describe('boothsInScope', () => {
  const booths = [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }]

  it("'all' is every booth, a list filters by booth id", () => {
    expect(boothsInScope('all', booths)).toHaveLength(3)
    expect(boothsInScope(['b2'], booths)).toEqual([{ id: 'b2' }])
    expect(boothsInScope([], booths)).toEqual([])
  })
})

describe('groupBoothsByCategory', () => {
  it('follows the event order, keeps booth order, and puts unknown categories last', () => {
    const booths = [
      { id: 'p1', category: 'play-tech' },
      { id: 'x', category: 'seminar' },
      { id: 't1', category: 'tech-xhibition' },
      { id: 'p2', category: 'play-tech' },
    ]
    expect(groupBoothsByCategory(booths).map((g) => [g.label, g.booths.map((b) => b.id)])).toEqual([
      ['Tech-Xhibition', ['t1']],
      ['Play-Tech', ['p1', 'p2']],
      ['seminar', ['x']],
    ])
  })
})
