import { describe, expect, it } from 'vitest'

import { staffAccessFor } from '@/lib/admin-access'

const none = { isAdmin: false, role: null, roleA: null, booth: false, gate: false } as const

describe('staffAccessFor (the D-day page)', () => {
  it('lets in admins, booth staff and gate staff', () => {
    expect(staffAccessFor({ ...none, isAdmin: true })).toBe(true)
    expect(staffAccessFor({ ...none, booth: true })).toBe(true)
    expect(staffAccessFor({ ...none, gate: true })).toBe(true)
  })

  it('lets in committee profiles and admin_roles staff roles', () => {
    expect(staffAccessFor({ ...none, roleA: 'staff' })).toBe(true)
    expect(staffAccessFor({ ...none, roleA: 'stakeholder' })).toBe(true)
    expect(staffAccessFor({ ...none, role: 'field_staff' })).toBe(true)
    expect(staffAccessFor({ ...none, role: 'booth_staff' })).toBe(true)
  })

  it('keeps out visitors, exhibitors, sponsors and companies', () => {
    expect(staffAccessFor(none)).toBe(false)
    expect(staffAccessFor({ ...none, role: 'exhibitor' })).toBe(false)
    expect(staffAccessFor({ ...none, roleA: 'sponsor_partner' })).toBe(false)
    expect(staffAccessFor({ ...none, roleA: 'company' })).toBe(false)
  })
})
