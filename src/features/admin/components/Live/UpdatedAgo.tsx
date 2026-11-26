"use client"

import { useEffect, useState } from "react"

import styles from "./Live.module.css"

/** "Updated 12s ago". Its own leaf: the ticking re-renders only this line. */
export default function UpdatedAgo({ at, failed }: { at: string; failed: boolean }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000)
    return () => clearInterval(timer)
  }, [])

  const seconds = Math.max(0, Math.round((now - new Date(at).getTime()) / 1000))
  const ago = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`

  return (
    <span className={styles.updated} role="status">
      Updated {ago} ago{failed ? " · last refresh failed, retrying" : ""}
    </span>
  )
}
