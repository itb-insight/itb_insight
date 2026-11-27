import { afterEach, describe, expect, it, vi } from 'vitest'

import { ADMIN_HOME_PATH, BOOTH_ADMIN_PATH, GATE_SECTION_PATH, adminLinkFor } from '@/lib/admin-nav'

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

  it('sends other staff and stakeholders to the hi-fi booth mock, outside production only', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(adminLinkFor({ isAdmin: false, roleA: 'staff', boothSection: false })).toBe(BOOTH_ADMIN_PATH)
    expect(adminLinkFor({ isAdmin: false, roleA: 'stakeholder', boothSection: false })).toBe(BOOTH_ADMIN_PATH)
    vi.stubEnv('NODE_ENV', 'production')
    expect(adminLinkFor({ isAdmin: false, roleA: 'staff', boothSection: false })).toBeNull()
  })

  it('shows nothing to visitors, sponsors and companies', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(adminLinkFor({ isAdmin: false, roleA: null, boothSection: false })).toBeNull()
    expect(adminLinkFor({ isAdmin: false, roleA: 'sponsor_partner', boothSection: false })).toBeNull()
    expect(adminLinkFor({ isAdmin: false, roleA: 'company', boothSection: false })).toBeNull()
  })
})
