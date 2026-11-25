"use client"

import { formatHms, formatMs } from "./format"
import { useNow } from "./useNow"

interface CountdownProps {
  until: string
  format?: "hms" | "ms"
  suffix?: string
  className?: string
}

export default function Countdown({ until, format = "hms", suffix, className }: CountdownProps) {
  const now = useNow()
  const left = new Date(until).getTime() - now
  const text = format === "hms" ? formatHms(left) : formatMs(left)

  return (
    <span className={className} suppressHydrationWarning>
      {text}
      {suffix}
    </span>
  )
}
