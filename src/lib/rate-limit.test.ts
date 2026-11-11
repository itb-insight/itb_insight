import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { checkRateLimit, getClientIp } from './rate-limit'

const request = (headers: Record<string, string>) => new NextRequest('http://localhost/api/x', { headers })

describe('getClientIp', () => {
  it('prefers the Cloudflare client IP over x-forwarded-for', () => {
    expect(getClientIp(request({ 'cf-connecting-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('9.9.9.9')
    expect(getClientIp(request({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('1.1.1.1')
    expect(getClientIp(request({}))).toBeNull()
  })
})

describe('checkRateLimit', () => {
  it('limits each identity separately from the shared IP limit', () => {
    // One school NAT IP, identity limit 2, IP limit 5.
    const req = request({ 'cf-connecting-ip': '10.0.0.1' })
    const opts = { scope: 'feedback-submit' as const, limit: 2, ipLimit: 5, windowMs: 60_000 }

    expect(checkRateLimit(req, { ...opts, identity: 'a' }).allowed).toBe(true)
    expect(checkRateLimit(req, { ...opts, identity: 'a' }).allowed).toBe(true)
    expect(checkRateLimit(req, { ...opts, identity: 'a' }).allowed).toBe(false)

    // Other students on the same IP are still allowed until the IP limit.
    expect(checkRateLimit(req, { ...opts, identity: 'b' }).allowed).toBe(true)
    expect(checkRateLimit(req, { ...opts, identity: 'c' }).allowed).toBe(true)
    expect(checkRateLimit(req, { ...opts, identity: 'd' }).allowed).toBe(true)
    expect(checkRateLimit(req, { ...opts, identity: 'e' }).allowed).toBe(false)
  })
})
