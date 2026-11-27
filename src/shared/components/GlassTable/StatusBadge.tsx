import type { ReactNode } from "react"

import styles from "./StatusBadge.module.css"

export type StatusTone = "success" | "neutral" | "warning" | "danger"

interface StatusBadgeProps {
  tone: StatusTone
  children: ReactNode
  className?: string
}

export default function StatusBadge({ tone, children, className = "" }: StatusBadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]} ${className}`}>{children}</span>
}
