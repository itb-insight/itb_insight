import { describe, expect, it } from 'vitest'

import { safeNext } from './safe-next'

describe('safeNext (open-redirect guard for ?next=)', () => {
  it.each([
    ['/dashboard/profile', '/dashboard/profile'],
    ['/dashboard/profile?tab=qr#top', '/dashboard/profile?tab=qr#top'],
    ['/feedback/inspirates-2026', '/feedback/inspirates-2026'],
  ])('keeps same-origin path %s', (raw, expected) => {
    expect(safeNext(raw)).toBe(expected)
  })

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    ' //evil.com',
    '/\t/evil.com',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
  ])('rejects off-site target %j', (raw) => {
    expect(safeNext(raw)).toBe('/dashboard')
  })

  it('falls back on empty input and honours a custom fallback', () => {
    expect(safeNext(null)).toBe('/dashboard')
    expect(safeNext(undefined)).toBe('/dashboard')
    expect(safeNext('')).toBe('/dashboard')
    expect(safeNext('//evil.com', '/')).toBe('/')
  })
})
