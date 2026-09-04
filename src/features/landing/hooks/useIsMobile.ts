"use client"

import { useEffect, useState } from "react"

// Defaults to false so the first client render matches the server render
// (window isn't available during SSR) — updates right after mount.
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [breakpoint])

  return isMobile
}
