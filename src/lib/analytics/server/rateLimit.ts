import { createHash } from "node:crypto"
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "../config"

/**
 * Fixed-window rate limiter for the public /api/track endpoint.
 *
 * HONEST LIMITS — this is per-process, in-memory:
 *   - N serverless instances means N x the intended budget
 *   - resets to zero on every redeploy
 *   - defeated by rotating IPs, or by a spoofed x-forwarded-for unless the
 *     platform overwrites that header (Vercel does; bare Node behind nginx
 *     may not)
 *
 * It stops a stuck retry loop and a casual curl-in-a-for-loop. It does not
 * stop a determined actor. The real fix is Upstash / Vercel KV or a platform
 * WAF rule — swap point is the `check` function below, whose signature does
 * not change. See docs/analytics/99-known-gaps.md.
 */

interface Window {
  count: number
  resetAt: number
}

const LIMITER_KEY = Symbol.for("itb.analytics.rateLimit")

type GlobalWithLimiter = typeof globalThis & { [LIMITER_KEY]?: Map<string, Window> }

function getWindows(): Map<string, Window> {
  const g = globalThis as GlobalWithLimiter
  g[LIMITER_KEY] ??= new Map<string, Window>()
  return g[LIMITER_KEY]
}

let writesSinceSweep = 0

function sweep(windows: Map<string, Window>, now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

/**
 * Derives a limiter key from request headers.
 *
 * Next 16 has no `request.ip`, so this reads x-forwarded-for. The result is
 * hashed rather than stored raw: an IP address is PII, and this module has no
 * business holding one in memory.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
  const ua = headers.get("user-agent") ?? ""
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 32)
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

export default function check(key: string): RateLimitResult {
  const windows = getWindows()
  const now = Date.now()

  // Amortised cleanup so a rotating-IP flood cannot grow the map unbounded.
  writesSinceSweep += 1
  if (writesSinceSweep >= 100) {
    writesSinceSweep = 0
    sweep(windows, now)
  }

  const existing = windows.get(key)

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  existing.count += 1

  if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}
