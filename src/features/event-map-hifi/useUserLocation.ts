"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/*
  The visitor's position for the "You are here" dot. It stays in the browser: nothing here sends
  it anywhere. (Self check-in has its own server-checked geofence in src/lib/geofence.ts.)

  The browser asks for permission when the map opens. `locate()` asks again: browsers show the
  prompt again when the visitor dismissed it, but once they press "Block" only the browser's site
  settings can undo that, so `locate()` then reports "denied" and the UI explains what to do.
*/

export interface UserPosition {
  lat: number
  lng: number
  accuracyM: number
}

export type LocateResult =
  | { ok: true; position: UserPosition }
  | { ok: false; reason: "denied" | "unavailable" | "unsupported" }

const WATCH_OPTIONS: PositionOptions = { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }

const toPosition = (p: GeolocationPosition): UserPosition => ({
  lat: p.coords.latitude,
  lng: p.coords.longitude,
  accuracyM: p.coords.accuracy,
})

const toReason = (e: GeolocationPositionError) =>
  e.code === e.PERMISSION_DENIED ? ("denied" as const) : ("unavailable" as const)

export function useUserLocation() {
  const [position, setPositionState] = useState<UserPosition | null>(null)
  const latest = useRef<UserPosition | null>(null)
  const watchId = useRef<number | null>(null)

  const setPosition = useCallback((next: UserPosition | null) => {
    latest.current = next
    setPositionState(next)
  }, [])

  const startWatch = useCallback(() => {
    if (watchId.current !== null || !("geolocation" in navigator)) return
    watchId.current = navigator.geolocation.watchPosition(
      (p) => setPosition(toPosition(p)),
      (e) => {
        // Permission revoked or never granted: stop, locate() can start again later.
        if (e.code === e.PERMISSION_DENIED && watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current)
          watchId.current = null
          setPosition(null)
        }
      },
      WATCH_OPTIONS,
    )
  }, [setPosition])

  useEffect(() => {
    startWatch()
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [startWatch])

  /**
   * Current position, asking for permission again if needed. While the watch is delivering
   * positions its latest one is used: a separate one-off request can wait for a *new* fix, which
   * a device that isn't moving may not produce before the timeout.
   */
  const locate = useCallback(
    () =>
      new Promise<LocateResult>((resolve) => {
        if (!("geolocation" in navigator)) return resolve({ ok: false, reason: "unsupported" })
        if (watchId.current !== null && latest.current) return resolve({ ok: true, position: latest.current })
        navigator.geolocation.getCurrentPosition(
          (p) => {
            const next = toPosition(p)
            setPosition(next)
            startWatch()
            resolve({ ok: true, position: next })
          },
          (e) => resolve({ ok: false, reason: toReason(e) }),
          { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
        )
      }),
    [startWatch, setPosition],
  )

  return { position, locate }
}
