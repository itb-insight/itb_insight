/* ==========================================
    Countdown-only flag, read by `src/proxy.ts` on every request
    COUNTDOWN_ONLY=true locks the whole site down to `public/countdown.html`:
    every page renders the countdown, every API route / non-GET request is 503,
    except the feedback form and the login / sign-up flow (COUNTDOWN_OPEN_* below).
    The hi-fi navbar hides its Event / Competition / Map / Dashboard links in this mode.
============================================= */

export const COUNTDOWN_PAGE = '/countdown.html'

// Public assets the countdown page itself loads. Everything else is blocked.
const COUNTDOWN_ASSETS = [
    '/fonts/excratch.woff2',
    '/fonts/Bitcount-Variable.ttf',
    '/images/Pattern_Kiri.svg',
    '/images/Pattern_Kanan.svg',
    '/icon.png',
]

// Pages that stay reachable during the countdown. /auth/callback is the OAuth / magic-link landing.
const COUNTDOWN_OPEN_PAGES = [/^\/login\/?$/, /^\/signup\/?$/, /^\/auth\/callback\/?$/, /^\/feedback\/[a-z0-9-]+\/?$/]

// API routes that stay reachable: the public feedback form (GET) and its submission (POST).
// The staff summary (/api/feedback) stays blocked.
const COUNTDOWN_OPEN_API = [/^\/api\/feedback\/[a-z0-9-]+\/?$/]

export function isCountdownOpenPage(pathname: string): boolean {
    return COUNTDOWN_OPEN_PAGES.some((pattern) => pattern.test(pathname))
}

export function isCountdownOpenApi(pathname: string): boolean {
    return COUNTDOWN_OPEN_API.some((pattern) => pattern.test(pathname))
}

export function isCountdownOnly(): boolean {
    return process.env.COUNTDOWN_ONLY === 'true'
}

export function isCountdownAsset(pathname: string): boolean {
    return COUNTDOWN_ASSETS.includes(pathname)
}
