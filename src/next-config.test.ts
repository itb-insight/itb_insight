import { describe, expect, it } from 'vitest'

import nextConfig from '../next.config'

// Guards the security headers and asset caching in next.config.ts against accidental removal.

describe('next.config headers', () => {
  it('sends the security headers on every path', async () => {
    const rules = await nextConfig.headers!()
    const all = rules.find((rule) => rule.source === '/:path*')
    const headers = Object.fromEntries((all?.headers ?? []).map(({ key, value }) => [key.toLowerCase(), value]))

    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['content-security-policy']).toContain("object-src 'none'")
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy']).toContain('camera=(self)')
    expect(headers['permissions-policy']).toContain('geolocation=(self)')
    expect(headers['strict-transport-security']).toMatch(/max-age=\d{8}/)
  })

  it('caches versioned assets long-term', async () => {
    const rules = await nextConfig.headers!()
    const video = rules.find((rule) => rule.source === '/itb-model/:path*')
    expect(video?.headers[0].value).toContain('immutable')
  })

  it('does not advertise the framework', () => {
    expect(nextConfig.poweredByHeader).toBe(false)
  })
})
