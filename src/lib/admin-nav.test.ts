import { afterEach, describe, expect, it, vi } from 'vitest'

import { ADMIN_HOME_PATH, DDAY_PATH, GATE_SECTION_PATH, adminLinkFor } from '@/lib/admin-nav'

describe('adminLinkFor', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sends admins to /admin, whichever source made them admin', () => {
    expect(adminLinkFor({ isAdmin: true, roleA: null, boothSection: true })).toBe(ADMIN_HOME_PATH)
    expect(adminLinkFor({ isAdmin: false, roleA: 'admin', boothSection: false })).toBe(ADMIN_HOME_PATH)
  })

  it('sends gate-only staff straight to the Gate section, in production too', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(adminLinkFor({ isAdmin: false, roleA: 'staff', boothSection: false, gateSection: true })).toBe(GATE_SECTION_PATH)
    expect(adminLinkFor({ isAdmin: false, roleA: 'staff', boothSection: true, gateSection: true })).toBe(ADMIN_HOME_PATH)
  })

  it('sends booth staff to /admin, in production too', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(adminLinkFor({ isAdmin: false, roleA: 'staff', boothSection: true })).toBe(ADMIN_HOME_PATH)
    expect(adminLinkFor({ isAdmin: false, roleA: 'stakeholder', boothSection: true })).toBe(ADMIN_HOME_PATH)
  })

  it('sends every other staff member to the D-day page, in production too', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(adminLinkFor({ isAdmin: false, roleA: 'staff', boothSection: false })).toBe(DDAY_PATH)
    expect(adminLinkFor({ isAdmin: false, roleA: 'stakeholder', boothSection: false })).toBe(DDAY_PATH)
    // admin_roles staff (field / booth) without a committee profile
    expect(adminLinkFor({ isAdmin: false, roleA: null, boothSection: false, staff: true })).toBe(DDAY_PATH)
  })

  it('shows nothing to visitors, sponsors and companies', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(adminLinkFor({ isAdmin: false, roleA: null, boothSection: false })).toBeNull()
    expect(adminLinkFor({ isAdmin: false, roleA: 'sponsor_partner', boothSection: false })).toBeNull()
    expect(adminLinkFor({ isAdmin: false, roleA: 'company', boothSection: false })).toBeNull()
  })
})
