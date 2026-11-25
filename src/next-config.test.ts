import { describe, expect, it } from 'vitest'

import nextConfig, { posthogRewrites } from '../next.config'

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

describe('next.config PostHog proxy', () => {
  it('rewrites /ingest to the configured PostHog region', () => {
    const us = posthogRewrites('us')
    expect(us.find((rule) => rule.source === '/ingest/:path*')?.destination).toBe('https://us.i.posthog.com/:path*')
    expect(us.find((rule) => rule.source === '/ingest/static/:path*')?.destination).toBe(
      'https://us-assets.i.posthog.com/static/:path*',
    )
    expect(posthogRewrites('eu').every((rule) => rule.destination.startsWith('https://eu'))).toBe(true)
  })

  it('specific paths come before the catch-all (first match wins)', () => {
    const sources = posthogRewrites('us').map((rule) => rule.source)
    expect(sources.indexOf('/ingest/:path*')).toBe(sources.length - 1)
  })

  it('proxies nothing without a valid region', () => {
    expect(posthogRewrites(undefined)).toEqual([])
    expect(posthogRewrites('https://evil.example')).toEqual([])
  })

  it('does not let Next redirect PostHog trailing-slash paths', () => {
    expect(nextConfig.skipTrailingSlashRedirect).toBe(true)
  })
})
