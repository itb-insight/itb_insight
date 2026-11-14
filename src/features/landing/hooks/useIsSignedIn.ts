"use client"

import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"

/** Client-side Supabase session check. `false` until known, so signed-out UI renders first. */
export function useIsSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user))
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  return signedIn
}
