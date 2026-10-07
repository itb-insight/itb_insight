"use client"

import { useCallback, useEffect, useRef } from "react"

/**
 * A clock corrected against the server's.
 *
 * The visitor's device clock can be wrong by minutes or hours, which would make any
 * countdown wrong by the same amount. Asking the server for the time on every tick
 * would fix that but means a request per second, per visitor.
 *
 * So the gap is measured **once** — from a timestamp the server rendered into the page,
 * which costs no extra request — cached, and added to the local clock from then on.
 * Every later reading is local, and because it is recomputed from `Date.now()` rather
 * than decremented, it stays correct across tab sleep, throttling and resume.
 *
 * `serverNow` omitted (or a page rendered without one) falls back to the device clock,
 * which is no worse than having no correction at all.
 */
export function useServerClock(serverNow?: number): () => number {
  const offsetRef = useRef(0)

  useEffect(() => {
    if (serverNow === undefined) return
    // Includes the time the response spent in flight, so the reading runs a few hundred
    // milliseconds behind at worst — immaterial next to a clock that is hours out.
    offsetRef.current = serverNow - Date.now()
  }, [serverNow])

  return useCallback(() => Date.now() + offsetRef.current, [])
}
