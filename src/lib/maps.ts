/* ==========================================
    Maps feature flag
    NEXT_PUBLIC_MAPS_DISABLED=true turns every map entry point off:
      - /event-map is rewritten to the maintenance page by `src/proxy.ts`
        (via getMaintenanceState, so the ?bypass=<secret> cookie still works)
      - navbar (desktop + mobile menu), footer, the Insight Festival
        "Lihat Peta" button and the "Buka Peta" CTAs on /event/<slug>
        render greyed out with a "Coming Soon!" pill instead of a link
    NEXT_PUBLIC_ so client components (mobile menu, error.tsx tree) see it too.
    It is inlined at build time: restart `next dev` / redeploy after changing it.
============================================= */

export const MAP_PATH = '/event-map'

export function isMapsDisabled(): boolean {
    return process.env.NEXT_PUBLIC_MAPS_DISABLED === 'true'
}

/** True when `href` points at the map and maps are disabled. */
export function isDisabledMapHref(href: string | null | undefined): boolean {
    if (!href || !isMapsDisabled()) return false
    const path = href.split(/[?#]/)[0]
    return path === MAP_PATH || path.startsWith(MAP_PATH + '/')
}
