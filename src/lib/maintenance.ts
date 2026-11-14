/* ==========================================
    Maintenance flags, read by `src/proxy.ts` on every request
    The whole process temporarily is toggled via .env.local
    Until Fathir gets the Vercel project back from Farhan :(
============================================= */

import { MAP_PATH, isMapsDisabled } from './maps'

export type MaintenanceState = {
    site: boolean
    pages: string[]
}

export function getMaintenanceState(): MaintenanceState {
    return {
        site: process.env.MAINTENANCE_SITE === 'true',
        // Comma-separated path prefixes, e.g. "/competition, /seminar"
        pages: (process.env.MAINTENANCE_PAGES ?? '')
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
            // NEXT_PUBLIC_MAPS_DISABLED=true: the map goes to the maintenance page too
            .concat(isMapsDisabled() ? [MAP_PATH] : []),
    }
}

export function isPageUnderMaintenance(pathname: string, pages: string[]) {
    return pages.some((p) => pathname === p || pathname.startsWith(p + '/'))
}