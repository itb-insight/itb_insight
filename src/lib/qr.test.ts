import { describe, expect, it } from 'vitest'

import { encodeVisitorQr, parseVisitorQr, VISITOR_QR_PREFIX } from './qr'

describe('visitor QR payload', () => {
  const token = 'q3Jx9_aZ-0bC1dE2fG3hI4'

  it('round-trips a token through encode/parse', () => {
    expect(encodeVisitorQr(token)).toBe(`${VISITOR_QR_PREFIX}${token}`)
    expect(parseVisitorQr(encodeVisitorQr(token))).toBe(token)
  })

  it('accepts a bare token and a legacy 64-hex token', () => {
    const legacy = 'a'.repeat(64)
    expect(parseVisitorQr(token)).toBe(token)
    expect(parseVisitorQr(legacy)).toBe(legacy)
    expect(parseVisitorQr(`  ${encodeVisitorQr(legacy)}\n`)).toBe(legacy)
  })

  it('rejects unrelated QR contents', () => {
    expect(parseVisitorQr('https://example.com/promo')).toBeNull()
    expect(parseVisitorQr('itbi:v2:abc')).toBeNull()
    expect(parseVisitorQr(`${VISITOR_QR_PREFIX}short`)).toBeNull()
    expect(parseVisitorQr('')).toBeNull()
    expect(parseVisitorQr(undefined)).toBeNull()
    expect(parseVisitorQr(42)).toBeNull()
  })
})
