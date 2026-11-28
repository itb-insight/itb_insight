"use client"

import { useEffect } from "react"

import { useHasSession } from "@/shared/hooks/useHasSession"

import { warmPages } from "./swClient"

/*
  Registers the service worker (public/sw.js, docs/OFFLINE.md) in production builds.
  Kill switch: NEXT_PUBLIC_PWA_DISABLED=1 unregisters it and deletes its caches on the next visit.
  Signed-in visitors get their QR and the arcade hub cached for offline use; the staff scanners
  and the map cache themselves when they are opened.
*/

const DISABLED = process.env.NEXT_PUBLIC_PWA_DISABLED === "1"
const ENABLED = process.env.NODE_ENV === "production" && !DISABLED

async function unregisterAll() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
  if (typeof caches !== "undefined") {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith("itbi-")).map((name) => caches.delete(name)))
  }
}

export default function ServiceWorkerRegistrar() {
  const signedIn = useHasSession()

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    if (!ENABLED) {
      if (DISABLED) void unregisterAll().catch(() => undefined)
      return
    }
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (ENABLED && signedIn) warmPages(["/arcade/qr", "/arcade"])
  }, [signedIn])

  return null
}
