"use client"

import { CloudOff } from "lucide-react"
import { useSyncExternalStore } from "react"

import styles from "./OfflineBanner.module.css"

/*
  Insight Arcade without signal (docs/OFFLINE.md): the service worker serves the last copy of the
  page, so points and quests are the ones from `renderedAt`. Says so while the phone is offline,
  and also online when the page is an old copy: on a slow connection the service worker serves the
  cached page after 4 s instead of waiting.
*/

const STALE_AFTER_MS = 5 * 60 * 1000

function subscribe(listener: () => void) {
  window.addEventListener("online", listener)
  window.addEventListener("offline", listener)
  return () => {
    window.removeEventListener("online", listener)
    window.removeEventListener("offline", listener)
  }
}
const getOffline = () => !navigator.onLine
const getOfflineOnServer = () => false
const noop = () => () => {}
const getNever = () => false

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })

export default function OfflineBanner({ renderedAt }: { renderedAt: string }) {
  const offline = useSyncExternalStore(subscribe, getOffline, getOfflineOnServer)
  // Read on the client once: a fresh render is seconds old, a cached copy minutes or hours.
  const stale = useSyncExternalStore(noop, () => Date.now() - Date.parse(renderedAt) > STALE_AFTER_MS, getNever)
  if (!offline && !stale) return null
  const time = timeFormat.format(new Date(renderedAt))
  return (
    <p className={styles.banner} role="status">
      <CloudOff size={16} aria-hidden="true" />
      {offline
        ? `Offline · data terakhir ${time} WIB. QR kamu tetap bisa di-scan.`
        : `Data terakhir dimuat ${time} WIB. Muat ulang untuk memperbarui.`}
    </p>
  )
}
