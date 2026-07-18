import type { DeviceInfo, DeviceType } from "./types"

const SESSION_KEY = "itb_analytics_session"

let cachedSessionId: string | null = null
let cachedDevice: DeviceInfo | null = null

function randomId(): string {
  // crypto.randomUUID needs a secure context — fine on localhost and https,
  // but keep a fallback so tracking never throws on a plain-http preview.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Session id is anonymous and session-scoped by design. It lives in
 * sessionStorage, never localStorage, so closing the tab ends the identity —
 * that keeps it out of "persistent identifier" territory.
 *
 * Never call during render: reading sessionStorage on the server returns a
 * different value than on the client and causes a hydration mismatch.
 */
export function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId
  if (typeof window === "undefined") return ""

  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) {
      cachedSessionId = existing
      return existing
    }
    const fresh = randomId()
    window.sessionStorage.setItem(SESSION_KEY, fresh)
    cachedSessionId = fresh
    return fresh
  } catch {
    // Private mode / storage disabled — fall back to an in-memory id.
    cachedSessionId = randomId()
    return cachedSessionId
  }
}

function detectDeviceType(ua: string): DeviceType {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet"
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile"
  return "desktop"
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge"
  if (/OPR\/|Opera/.test(ua)) return "Opera"
  if (/Firefox\//.test(ua)) return "Firefox"
  if (/Chrome\//.test(ua)) return "Chrome"
  if (/Safari\//.test(ua)) return "Safari"
  return "Other"
}

function detectOs(ua: string): string {
  if (/Windows/.test(ua)) return "Windows"
  if (/Android/.test(ua)) return "Android"
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS"
  if (/Mac OS X/.test(ua)) return "macOS"
  if (/Linux/.test(ua)) return "Linux"
  return "Other"
}

/**
 * Returns only the parsed classification, never the raw user-agent string —
 * a full UA is a fingerprinting surface we have no use for.
 */
export function getDeviceInfo(): DeviceInfo {
  if (cachedDevice) return cachedDevice
  if (typeof navigator === "undefined") {
    return { deviceType: "desktop", browser: "Other", os: "Other" }
  }

  const ua = navigator.userAgent
  cachedDevice = {
    deviceType: detectDeviceType(ua),
    browser: detectBrowser(ua),
    os: detectOs(ua),
  }
  return cachedDevice
}
