import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The data cache needs a Next server; here a cached function is just the function.
vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))

const { envFilter, hogql, isPostHogQueryConfigured, sqlTime } = await import('./posthog-query')

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.stubEnv('VERCEL_ENV', '')
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  fetchMock.mockReset()
})

function configure() {
  vi.stubEnv('POSTHOG_PROJECT_ID', '42')
  vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phx_test')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_REGION', 'us')
}

describe('posthog-query', () => {
  it('is off without a project id, key and region, and then never calls out', async () => {
    vi.stubEnv('POSTHOG_PROJECT_ID', '')
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', '')
    expect(isPostHogQueryConfigured()).toBe(false)
    expect(await hogql('x', 'select 1')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a non-numeric project id', () => {
    configure()
    vi.stubEnv('POSTHOG_PROJECT_ID', '42/../1')
    expect(isPostHogQueryConfigured()).toBe(false)
  })

  it('sends HogQL to the private API host of the region with the personal key', async () => {
    configure()
    fetchMock.mockResolvedValue(Response.json({ columns: ['count()'], results: [[7]] }))

    expect(await hogql('probe', 'select count() from events')).toEqual({ columns: ['count()'], results: [[7]] })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://us.posthog.com/api/projects/42/query/')
    expect(init.headers.Authorization).toBe('Bearer phx_test')
    expect(JSON.parse(init.body)).toEqual({
      name: 'admin:probe',
      query: { kind: 'HogQLQuery', query: 'select count() from events' },
    })
  })

  it('returns null (panel unavailable) on an HTTP error or a malformed body', async () => {
    configure()
    fetchMock.mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
    expect(await hogql('a', 'select 1')).toBeNull()

    fetchMock.mockResolvedValueOnce(Response.json({ detail: 'nope' }))
    expect(await hogql('b', 'select 1')).toBeNull()

    fetchMock.mockRejectedValueOnce(new Error('timeout'))
    expect(await hogql('c', 'select 1')).toBeNull()
  })

  it('counts only production events on production, everything elsewhere', () => {
    expect(envFilter()).toBe('')
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(envFilter()).toBe('')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(envFilter()).toBe("and properties.app_env = 'production'")
  })

  it('formats dates as UTC datetime literals and refuses invalid ones', () => {
    expect(sqlTime(new Date('2026-11-24T08:05:09.123Z'))).toBe("toDateTime('2026-11-24 08:05:09', 'UTC')")
    expect(() => sqlTime(new Date('nope'))).toThrow()
  })
})
