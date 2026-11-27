/* ==========================================
    Insight Arcade feature flag
    NEXT_PUBLIC_ARCADE_DISABLED=true turns the visitor side of the arcade off:
      - /arcade and everything under it is rewritten to the maintenance page by `src/proxy.ts`
        (via getMaintenanceState, so the ?bypass=<secret> cookie still works for testing)
      - the navbar and mobile menu "Arcade" links render greyed out with a "Coming Soon!" pill
      - POST /api/arcade/proof answers 503
    Staff tools (/admin/arcade-review, /admin/prizes) and booth scans are untouched.
    NEXT_PUBLIC_ so client components (mobile menu) see it too.
    It is inlined at build time: restart `next dev` / redeploy after changing it.
============================================= */

export const ARCADE_PATH = '/arcade'

export function isArcadeDisabled(): boolean {
    return process.env.NEXT_PUBLIC_ARCADE_DISABLED === 'true'
}
