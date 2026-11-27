"use client"

import { useEffect } from "react"

import { isBeforeDDayEnd } from "@/features/home/homeConfig"

const KEY = "itb-insight:location-asked"

/*
  Until D-day ends, ask every visitor for location permission when the site opens, if they have not
  answered yet ("prompt" state). Nothing is read or sent: the position is discarded, this only gets
  the browser permission in place for the map and opt-in booth presence. Where the Permissions API
  is missing (older Safari), ask at most once per tab session so it does not prompt on every page.
*/
export default function LocationPermissionPrompt() {
  useEffect(() => {
    if (!isBeforeDDayEnd() || !("geolocation" in navigator)) return

    const ask = () => navigator.geolocation.getCurrentPosition(() => {}, () => {}, { maximumAge: Infinity, timeout: 30_000 })

    let cancelled = false
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (!cancelled && status.state === "prompt") ask()
        })
        .catch(() => {})
    } else {
      try {
        if (sessionStorage.getItem(KEY)) return
        sessionStorage.setItem(KEY, "1")
      } catch {
        // ignore
      }
      ask()
    }
    return () => {
      cancelled = true
    }
  }, [])
  return null
}
