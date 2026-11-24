import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The SDK is replaced by a recorder: these tests cover our hand-off and privacy hooks, not PostHog.
const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  register: vi.fn(),
  capture: vi.fn(),
}))
vi.mock('posthog-js', () => ({ default: sdk }))

type Modules = {
  posthog: typeof import('./posthog')
  queue: typeof import('./queue')
  logEvent: typeof import('./logEvent').default
}

/** Fresh modules, so the NEXT_PUBLIC_* values read at import time follow the stubbed env. */
async function load(env: Record<string, string>): Promise<Modules> {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return {
    posthog: await import('./posthog'),
    queue: await import('./queue'),
    logEvent: (await import('./logEvent')).default,
  }
}

/** Lets the idle callback, the dynamic import and the .then chain run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  // Plain Node: give the modules the bits of `window` they touch. Idle callbacks run at once.
  vi.stubGlobal('window', {
    location: { pathname: '/competition' },
    requestIdleCallback: (callback: () => void) => callback(),
  })
  sdk.init.mockClear()
  sdk.register.mockClear()
  sdk.capture.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('stripQuery / stripUrlQueries', () => {
  it('drops query strings and hashes from absolute URLs only', async () => {
    const { posthog } = await load({})
    expect(posthog.stripQuery('https://insight.test/auth/callback?code=secret#x')).toBe('https://insight.test/auth/callback')
    expect(posthog.stripQuery('http://localhost:3000/?utm_source=ig')).toBe('http://localhost:3000/')
    expect(posthog.stripQuery('/relative?keep=1')).toBe('/relative?keep=1')
    expect(posthog.stripQuery('not a url')).toBe('not a url')
  })

  it('cleans event properties and person properties', async () => {
    const { posthog } = await load({})
    const cleaned = posthog.stripUrlQueries({
      uuid: 'u',
      event: '$pageview',
      properties: {
        $current_url: 'https://insight.test/login?token=abc',
        $referrer: 'https://google.com/search?q=itb',
        depth: 50,
      },
      $set_once: { $initial_current_url: 'https://insight.test/?email=a@b.c' },
    })
    expect(cleaned?.properties).toEqual({
      $current_url: 'https://insight.test/login',
      $referrer: 'https://google.com/search',
      depth: 50,
    })
    expect(cleaned?.$set_once).toEqual({ $initial_current_url: 'https://insight.test/' })
  })

  it('configures the privacy posture and the /ingest proxy', async () => {
    const { posthog } = await load({})
    const config = posthog.posthogConfig()
    expect(config).toMatchObject({
      api_host: '/ingest',
      persistence: 'localStorage',
      autocapture: false,
      disable_session_recording: true,
      person_profiles: 'identified_only',
    })
    expect(config.before_send).toBe(posthog.stripUrlQueries)
  })
})

describe('queue → PostHog', () => {
  it('does nothing and keeps nothing without a key', async () => {
    const { queue, logEvent } = await load({ NEXT_PUBLIC_POSTHOG_KEY: '' })
    logEvent('sponsor_click', { sponsorId: 'kai' }, { force: true })
    await settle()
    expect(sdk.init).not.toHaveBeenCalled()
    expect(queue.pendingCount()).toBe(0)
  })

  it('delivers events fired before the SDK loads, with division, path and app_env', async () => {
    const { logEvent } = await load({ NEXT_PUBLIC_POSTHOG_KEY: 'phc_test', NEXT_PUBLIC_VERCEL_ENV: 'preview' })
    logEvent('sponsor_click', { sponsorId: 'kai' }, { force: true })
    await settle()

    expect(sdk.init).toHaveBeenCalledTimes(1)
    expect(sdk.register).toHaveBeenCalledWith({ app_env: 'preview' })
    expect(sdk.capture).toHaveBeenCalledWith(
      'sponsor_click',
      { sponsorId: 'kai', division: 'SP', page_path: '/competition' },
      expect.objectContaining({ timestamp: expect.any(Date) }),
    )

    // Once loaded, events go straight through; the SDK is initialised only once.
    logEvent('sponsor_click', { sponsorId: 'jete' }, { force: true })
    expect(sdk.capture).toHaveBeenCalledTimes(2)
    expect(sdk.init).toHaveBeenCalledTimes(1)
  })

  it('labels local events as development', async () => {
    const { posthog } = await load({ NEXT_PUBLIC_POSTHOG_KEY: 'phc_test', NEXT_PUBLIC_VERCEL_ENV: '' })
    expect(posthog.APP_ENV).toBe('development')
  })

  it('sends urgent (page-hide) events with a beacon', async () => {
    const { logEvent } = await load({ NEXT_PUBLIC_POSTHOG_KEY: 'phc_test' })
    logEvent('funnel_dropoff', { funnelId: 'signup' }, { force: true, urgent: true })
    await settle()
    expect(sdk.capture).toHaveBeenCalledWith(
      'funnel_dropoff',
      expect.anything(),
      expect.objectContaining({ transport: 'sendBeacon', send_instantly: true }),
    )
  })

  it('caps the buffer while the SDK is loading, dropping the oldest', async () => {
    // Idle never fires, so the SDK never loads and everything stays buffered.
    vi.stubGlobal('window', { location: { pathname: '/' }, requestIdleCallback: () => {} })
    const { queue } = await load({ NEXT_PUBLIC_POSTHOG_KEY: 'phc_test' })
    for (let i = 0; i < queue.MAX_PENDING + 25; i += 1) {
      queue.enqueue({ name: 'scroll_depth', division: 'MISC', pagePath: '/', metadata: { i }, ts: i })
    }
    expect(queue.pendingCount()).toBe(queue.MAX_PENDING)
  })
})
