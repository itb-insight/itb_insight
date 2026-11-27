"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { isBeforeDDayEnd } from "./homeConfig"

const KEY = "itb-insight:dday-qr-jump"

/*
  D-day: opening the dashboard jumps straight to the personal QR (Profile, #qr), so visitors can
  show it at the gate/booths without hunting for it. Once per tab session, so the sidebar's
  "Home" link still reaches the home page afterwards. Off once D-day is over.
*/
export default function DDayQrJump() {
  const router = useRouter()
  useEffect(() => {
    if (!isBeforeDDayEnd()) return
    try {
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, "1")
    } catch {
      // Storage blocked: still jump; Home stays reachable from the profile page's sidebar.
    }
    router.replace("/dashboard/profile#qr")
  }, [router])
  return null
}
