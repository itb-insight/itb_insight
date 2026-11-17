"use client"

import { useHasSession } from "@/shared/hooks/useHasSession"

/** Session-cookie check for UI only. `false` until known, so signed-out UI renders first. */
export function useIsSignedIn(): boolean {
  return useHasSession()
}
