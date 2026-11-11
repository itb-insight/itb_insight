/* ==========================================
    Countdown-only flag, read by `src/proxy.ts` on every request
    COUNTDOWN_ONLY=true locks the whole site down to `public/countdown.html`:
    every page renders the countdown, every API route / non-GET request is 503.
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

export function isCountdownOnly(): boolean {
    return process.env.COUNTDOWN_ONLY === 'true'
}

export function isCountdownAsset(pathname: string): boolean {
    return COUNTDOWN_ASSETS.includes(pathname)
}
