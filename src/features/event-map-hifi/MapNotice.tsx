"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

import styles from "./MapNotice.module.css"

const AUTO_DISMISS_MS = 8000

/** A short message over the map (e.g. location blocked). Closes itself after a few seconds. */
export default function MapNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div className={styles.notice} role="status">
      <p className={styles.text}>{message}</p>
      <button type="button" className={styles.close} aria-label="Tutup" onClick={onDismiss}>
        <X aria-hidden="true" />
      </button>
    </div>
  )
}
