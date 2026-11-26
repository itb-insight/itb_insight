"use client"

import dynamic from "next/dynamic"

import { useHasSession } from "@/shared/hooks/useHasSession"

// Booth presence and feedback prompts are for signed-in visitors only: everyone else downloads
// this file and nothing more (no Supabase client, no tracker).
const OnSite = dynamic(() => import("./OnSite"), { ssr: false })

export default function OnSiteRoot() {
  const signedIn = useHasSession()
  return signedIn ? <OnSite /> : null
}
