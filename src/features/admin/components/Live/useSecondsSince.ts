"use client"

import { useEffect, useState } from "react"

/**
 * Whole seconds since `at`, refreshed every `everyMs`. The first render (server and hydration)
 * reads 0 so both agree; the clock starts once mounted. Reading Date.now() during render would
 * differ between the two and break hydration.
 */
export function useSecondsSince(at: string, everyMs = 5_000): number {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const timer = setInterval(tick, everyMs)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [everyMs])

  if (now === null) return 0
  return Math.max(0, Math.round((now - new Date(at).getTime()) / 1000))
}
