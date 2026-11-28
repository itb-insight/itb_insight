/*
  Messages to the service worker (public/sw.js, docs/OFFLINE.md). No-ops where there is none
  (development, unsupported browsers, the PWA kill switch).
*/

export type SwMessage =
  | { type: "WARM"; urls: string[]; assets?: string[] }
  | { type: "WARM_MAP"; styleUrl: string; tiles: Array<{ z: number; x: number; y: number }>; fontStacks: string[] }
  | { type: "CLEAR_USER" }

export async function postToServiceWorker(message: SwMessage): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
    const registration = await navigator.serviceWorker.getRegistration()
    const worker = registration?.active ?? navigator.serviceWorker.controller
    worker?.postMessage(message)
  } catch {
    // Best effort: caching for offline use is never required.
  }
}

/**
 * Scripts and styles this page has loaded so far, including lazy chunks the HTML doesn't name.
 * On a first visit the service worker starts after they were fetched, so it never saw them.
 */
function loadedStaticAssets(): string[] {
  try {
    return performance
      .getEntriesByType("resource")
      .map((entry) => new URL(entry.name))
      .filter((url) => url.origin === location.origin && url.pathname.startsWith("/_next/static/"))
      .map((url) => url.pathname + url.search)
  } catch {
    return []
  }
}

/** Caches pages (and their scripts) for offline use, once the browser is idle. */
export function warmPages(urls: string[]): void {
  const run = () => void postToServiceWorker({ type: "WARM", urls, assets: loadedStaticAssets() })
  if (typeof window === "undefined") return
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 5000 })
  else setTimeout(run, 2000)
}

/** Sign-out: drop cached signed-in pages (QR, arcade, admin) from this browser. */
export async function clearUserCaches(): Promise<void> {
  await postToServiceWorker({ type: "CLEAR_USER" })
  try {
    if (typeof caches !== "undefined") {
      const names = await caches.keys()
      await Promise.all(names.filter((name) => name.startsWith("itbi-pages")).map((name) => caches.delete(name)))
    }
  } catch {
    // Cache Storage unavailable.
  }
}
