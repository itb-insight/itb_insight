/*
  ITB Insight service worker (PWA). Rules and how to change them: docs/OFFLINE.md.
  Hand-written, no build step. Registered by src/shared/components/Pwa/ServiceWorkerRegistrar.tsx.

  - /_next/static/*                     cache first (file names are content hashes)
  - pages in OFFLINE_PAGES (navigations) network first, cached copy when offline or slow
  - other navigations                   network, /offline.html when offline
  - images, pins, fonts, icons          stale-while-revalidate
  - Carto basemap (style, tiles, glyphs, sprites) stale-while-revalidate
  - never: /api, /ingest, /auth, RSC requests, non-GET, other origins (Supabase, PostHog...)

  Bump VERSION when these rules or OFFLINE_PAGES change: old caches are deleted on activate.
*/

const VERSION = "v1"
const SHELL = `itbi-shell-${VERSION}`
const STATIC = `itbi-static-${VERSION}`
const PAGES = `itbi-pages-${VERSION}` // signed-in pages: cleared on sign-out (CLEAR_USER)
const ASSETS = `itbi-assets-${VERSION}`
const MAP = `itbi-map-${VERSION}`
const KEEP = [SHELL, STATIC, PAGES, ASSETS, MAP]
const LIMITS = { [STATIC]: 400, [ASSETS]: 250, [MAP]: 800 }

const OFFLINE_URL = "/offline.html"
const OFFLINE_PAGES = ["/", "/event-map", "/arcade", "/arcade/qr", "/admin/booth", "/admin/gate"]
const MAP_HOSTS = ["basemaps.cartocdn.com", "tiles.basemaps.cartocdn.com"]
const ASSET_PATH = /^\/(?:_next\/image|images|deco|assets|events|map-pin|fonts|icons|sponsors|media-partner)\/|^\/(?:icon|apple-icon)[^/]*$|^\/manifest\.webmanifest$/
const SKIP_PATH = /^\/(?:api|ingest|auth)(?:\/|$)/
const NAV_TIMEOUT_MS = 4000

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n.startsWith("itbi-") && !KEEP.includes(n)).map((n) => caches.delete(n)))
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => undefined)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return
  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    if (SKIP_PATH.test(url.pathname)) return
    // React Server Component payloads (client-side navigation, prefetch): leave to the network.
    if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return
    if (request.mode === "navigate") return event.respondWith(navigation(event, url))
    if (url.pathname.startsWith("/_next/static/")) return event.respondWith(cacheFirst(event, STATIC))
    if (ASSET_PATH.test(url.pathname)) return event.respondWith(staleWhileRevalidate(event, ASSETS))
    return
  }

  if (MAP_HOSTS.includes(url.hostname)) event.respondWith(staleWhileRevalidate(event, MAP))
})

// ---- strategies -----------------------------------------------------------------------------

function pageKey(url) {
  const path = url.pathname.replace(/\/+$/, "") || "/"
  return OFFLINE_PAGES.includes(path) ? path : null
}

/** A page worth keeping: a real 200 from this origin, not a redirect (login) or an error page. */
function isCacheablePage(response) {
  return response && response.ok && response.status === 200 && response.type === "basic" && !response.redirected
}

async function navigation(event, url) {
  const key = pageKey(url)
  const network = (async () => {
    const preloaded = await event.preloadResponse
    const response = preloaded || (await fetch(event.request))
    if (key && isCacheablePage(response)) {
      const copy = response.clone()
      event.waitUntil(caches.open(PAGES).then((cache) => cache.put(key, copy)))
    }
    return response
  })()

  if (!key) {
    try {
      return await network
    } catch {
      return (await caches.match(OFFLINE_URL)) || Response.error()
    }
  }

  // Network first, but don't keep staff waiting on a weak signal when a copy exists.
  const cached = caches.open(PAGES).then((cache) => cache.match(key))
  const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), NAV_TIMEOUT_MS))
  event.waitUntil(network.catch(() => undefined))
  try {
    const first = await Promise.race([network, timeout])
    if (first !== "timeout") return first
    const copy = await cached
    return copy || (await network)
  } catch {
    return (await cached) || (await caches.match(OFFLINE_URL)) || Response.error()
  }
}

async function cacheFirst(event, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(event.request)
  if (cached) return cached
  const response = await fetch(event.request)
  if (response.ok) {
    const copy = response.clone()
    event.waitUntil(cache.put(event.request, copy).then(() => trim(cacheName)))
  }
  return response
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(event.request)
  const network = fetch(event.request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(event.request, response.clone())
        await trim(cacheName)
      }
      return response
    })
    .catch(() => null)
  if (cached) {
    event.waitUntil(network)
    return cached
  }
  return (await network) || Response.error()
}

const lastTrim = {}

/** Keeps a cache under its LIMITS entry. Listing keys is slow, so at most every 30 s per cache. */
async function trim(cacheName) {
  const limit = LIMITS[cacheName]
  if (!limit || Date.now() - (lastTrim[cacheName] || 0) < 30000) return
  lastTrim[cacheName] = Date.now()
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  // Oldest first (insertion order).
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)))
}

// ---- messages from the pages ----------------------------------------------------------------

self.addEventListener("message", (event) => {
  const data = event.data || {}
  if (event.origin && event.origin !== self.location.origin) return
  if (data.type === "WARM" && Array.isArray(data.urls)) event.waitUntil(warmPages(data.urls, data.assets))
  else if (data.type === "WARM_MAP") event.waitUntil(warmMap(data))
  else if (data.type === "CLEAR_USER") event.waitUntil(caches.delete(PAGES))
})

/** Fetches into `cacheName` what it doesn't have yet, a few at a time. */
async function fetchMissing(cacheName, urls, init) {
  const cache = await caches.open(cacheName)
  const queue = [...new Set(urls)]
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift()
      try {
        if (await cache.match(url)) continue
        const response = await fetch(url, init)
        if (response.ok) await cache.put(url, response)
      } catch {
        // Offline or refused: the next warm-up tries again.
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()])
  await trim(cacheName)
}

/** Stores pages and the scripts and styles they load (named in the HTML or already loaded by the page). */
async function warmPages(urls, loaded) {
  const cache = await caches.open(PAGES)
  const assets = (Array.isArray(loaded) ? loaded : []).filter(
    (path) => typeof path === "string" && path.startsWith("/_next/static/"),
  )
  for (const raw of urls.slice(0, 10)) {
    const url = new URL(raw, self.location.origin)
    const key = url.origin === self.location.origin ? pageKey(url) : null
    if (!key) continue
    try {
      const response = await fetch(key, { credentials: "same-origin", headers: { Accept: "text/html" } })
      if (!isCacheablePage(response)) continue
      const html = await response.clone().text()
      await cache.put(key, response)
      for (const match of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.push(match[0])
    } catch {
      // Offline: keep what is cached.
    }
  }
  await fetchMissing(STATIC, assets.slice(0, 200))
}

/** The Carto style, its sprites, our glyphs and the tiles around the venue. */
async function warmMap({ styleUrl, tiles, fontStacks }) {
  if (typeof styleUrl !== "string" || !MAP_HOSTS.includes(new URL(styleUrl).hostname)) return
  let style
  try {
    const cache = await caches.open(MAP)
    let response = await fetch(styleUrl)
    if (response.ok) await cache.put(styleUrl, response.clone())
    else response = await cache.match(styleUrl)
    if (!response) return
    style = await response.json()
  } catch {
    const cached = await caches.match(styleUrl)
    if (!cached) return
    style = await cached.json()
  }

  const urls = []
  const coords = Array.isArray(tiles) ? tiles.slice(0, 200) : []
  for (const source of Object.values(style.sources || {})) {
    if (source.type !== "vector" && source.type !== "raster") continue
    let templates = source.tiles
    if (!templates && source.url) {
      try {
        const tileJson = await (await fetch(source.url)).json()
        templates = tileJson.tiles
        urls.push(source.url)
      } catch {
        continue
      }
    }
    for (const template of templates || []) {
      for (const { z, x, y } of coords) {
        urls.push(template.replace("{z}", z).replace("{x}", x).replace("{y}", y))
      }
    }
  }
  const sprites = typeof style.sprite === "string" ? [style.sprite] : (style.sprite || []).map((s) => s.url)
  for (const sprite of sprites) {
    for (const suffix of [".json", ".png", "@2x.json", "@2x.png"]) urls.push(sprite + suffix)
  }
  if (typeof style.glyphs === "string") {
    for (const stack of Array.isArray(fontStacks) ? fontStacks.slice(0, 6) : []) {
      urls.push(style.glyphs.replace("{fontstack}", stack).replace("{range}", "0-255"))
    }
  }
  await fetchMissing(
    MAP,
    urls.filter((u) => MAP_HOSTS.includes(new URL(u).hostname)),
    { mode: "cors" },
  )
}
