import clsx from "clsx"

import styles from "./quest.module.css"

interface SegmentBarProps {
  filled: number
  total: number
  className?: string
}

export default function SegmentBar({ filled, total, className }: SegmentBarProps) {
  const safeTotal = Math.max(1, total)
  const safeFilled = Math.min(Math.max(0, filled), safeTotal)
  return (
    <div
      className={clsx(styles.segmentBar, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={safeFilled}
    >
      {Array.from({ length: safeTotal }, (_, index) => (
        <span key={index} className={clsx(styles.segment, index < safeFilled && styles.segmentFilled)} />
      ))}
    </div>
  )
}
