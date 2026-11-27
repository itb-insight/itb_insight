"use client"

import styles from "./Live.module.css"
import { useSecondsSince } from "./useSecondsSince"

/** "Updated 12s ago". Its own leaf: the ticking re-renders only this line. */
export default function UpdatedAgo({ at, failed }: { at: string; failed: boolean }) {
  const seconds = useSecondsSince(at)
  const ago = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`

  return (
    <span className={styles.updated} role="status">
      Updated {ago} ago{failed ? " · last refresh failed, retrying" : ""}
    </span>
  )
}
