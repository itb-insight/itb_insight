/* ==========================================
    Event location switch
    EVENTS_LOCATION_TBA=true replaces the location of EVERY event with "To be Announced":
      - /event list (desktop + mobile) and /dashboard/event-list cards
      - /event/<slug> "Lokasi" quick fact and the "other events" cards
      - the JSON-LD `location.name` (so Google doesn't index the hidden venue)
    Read on the server only (the event data modules are `server-only`), so it is NOT
    NEXT_PUBLIC_: redeploy after changing it on Vercel, restart `next dev` locally.
============================================= */

export const LOCATION_TBA_TEXT = 'To be Announced'

export function isEventLocationTba(): boolean {
    return process.env.EVENTS_LOCATION_TBA === 'true'
}

/** Returns `location` as-is, or "To be Announced" when the switch is on. */
export function displayLocation(location: string): string {
    return isEventLocationTba() ? LOCATION_TBA_TEXT : location
}
