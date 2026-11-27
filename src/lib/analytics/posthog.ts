import type { CaptureResult, PostHog, PostHogConfig, Properties } from "posthog-js"

/**
 * Lazy PostHog loader. The only module that imports posthog-js, and only via import(), so the SDK
 * is never in a page's first-load JS (CLAUDE.md performance rules).
 *
 * Privacy posture (see docs/analytics and /privacy):
 *   - anonymous id in localStorage, no cookies, never identify()
 *   - no autocapture, session replay, surveys, heatmaps or feature flags
 *   - query strings and hashes are stripped from every URL before an event leaves the browser
 *     (magic-link and OAuth callbacks carry codes there)
 *   - the IP is discarded by the project setting "Discard client IP data"
 *
 * Requests go to /ingest on our own domain; next.config.ts rewrites them to PostHog.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ""
const REGION = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us"

/**
 * One PostHog project serves every environment (free plan), so each event says where it came from
 * and /admin filters on it. NEXT_PUBLIC_VERCEL_ENV is set by Vercel; anything else is local.
 */
export const APP_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV || "development"

/** Path the browser sends to. Must match the rewrites in next.config.ts. */
export const INGEST_PATH = "/ingest"

let loading: Promise<PostHog | null> | null = null

export function isPostHogConfigured(): boolean {
  return KEY !== ""
}

const ABSOLUTE_URL = /^https?:\/\//i

/** `https://x.y/a/b?code=1#t` → `https://x.y/a/b`. Non-URLs are returned unchanged. */
export function stripQuery(value: string): string {
  if (!ABSOLUTE_URL.test(value)) return value
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split(/[?#]/, 1)[0]
  }
}

function stripProperties(properties: Properties | undefined): Properties | undefined {
  if (!properties) return properties
  const out: Properties = {}
  for (const [key, value] of Object.entries(properties)) {
    out[key] = typeof value === "string" ? stripQuery(value) : value
  }
  return out
}

/** before_send hook: removes query strings and hashes from every URL-valued property. */
export function stripUrlQueries(event: CaptureResult | null): CaptureResult | null {
  if (!event) return event
  return {
    ...event,
    properties: stripProperties(event.properties) ?? {},
    $set: stripProperties(event.$set),
    $set_once: stripProperties(event.$set_once),
  }
}

export function posthogConfig(): Partial<PostHogConfig> {
  return {
    api_host: INGEST_PATH,
    ui_host: REGION === "eu" ? "https://eu.posthog.com" : "https://us.posthog.com",
    defaults: "2026-05-30",
    persistence: "localStorage",
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: "history_change",
    capture_pageleave: true,
    capture_performance: { web_vitals: true, network_timing: false },
    capture_heatmaps: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    rageclick: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    advanced_disable_flags: true,
    mask_personal_data_properties: true,
    before_send: stripUrlQueries,
  }
}

function onIdle(callback: () => void): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 4000 })
  } else {
    setTimeout(callback, 1500)
  }
}

/**
 * Loads and initialises PostHog once, when the browser is idle. Resolves to null when no key is
 * configured, on the server, or if the SDK fails to load — analytics must never break a page.
 */
export function loadPostHog(): Promise<PostHog | null> {
  if (typeof window === "undefined" || !isPostHogConfigured()) return Promise.resolve(null)

  loading ??= new Promise((resolve) => {
    onIdle(() => {
      import("posthog-js")
        .then(({ default: posthog }) => {
          posthog.init(KEY, posthogConfig())
          posthog.register({ app_env: APP_ENV })
          resolve(posthog)
        })
        .catch(() => resolve(null))
    })
  })
  return loading
}

/** Test-only: forget the loaded instance. */
export function resetPostHogForTests(): void {
  loading = null
}
