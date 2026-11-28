"use client"

import { CloudOff } from "lucide-react"
import { useSyncExternalStore } from "react"

import styles from "./OfflineBanner.module.css"

/*
  Insight Arcade without signal (docs/OFFLINE.md): the service worker serves the last copy of the
  page, so points and quests are the ones from `renderedAt`. Says so while the phone is offline.
*/

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

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })

export default function OfflineBanner({ renderedAt }: { renderedAt: string }) {
  const offline = useSyncExternalStore(subscribe, getOffline, getOfflineOnServer)
  if (!offline) return null
  return (
    <p className={styles.banner} role="status">
      <CloudOff size={16} aria-hidden="true" />
      Offline · data terakhir {timeFormat.format(new Date(renderedAt))} WIB. QR kamu tetap bisa di-scan.
    </p>
  )
}
