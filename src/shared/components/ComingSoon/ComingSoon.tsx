import type { ReactNode } from "react"
import styles from "./ComingSoon.module.css"

export type ComingSoonPlacement = "top" | "bottom" | "left" | "right"

/** The pill itself. Put it inside an element that has `comingSoonHostClass` and is positioned. */
export function ComingSoonPill({ placement = "top" }: { placement?: ComingSoonPlacement }) {
  return (
    <span role="tooltip" className={`${styles.pill} ${styles[placement]}`}>
      Coming Soon!
    </span>
  )
}

export const comingSoonHostClass = styles.host

/**
 * Greyed-out, non-clickable stand-in for a link to a disabled feature.
 * `className` keeps the original link's typography; the colour is overridden.
 */
export default function ComingSoon({
  children,
  className = "",
  placement = "bottom",
}: {
  children: ReactNode
  className?: string
  placement?: ComingSoonPlacement
}) {
  return (
    <span
      tabIndex={0}
      aria-disabled="true"
      className={`${className} ${styles.anchor} ${styles.host} ${styles.muted}`}
    >
      {children}
      <ComingSoonPill placement={placement} />
    </span>
  )
}
