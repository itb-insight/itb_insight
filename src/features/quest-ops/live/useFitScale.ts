"use client"

import { useEffect, useRef } from "react"

export function useFitScale<T extends HTMLElement>(width: number, height: number) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    const apply = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const scale = Math.min(el.clientWidth / width, el.clientHeight / height)
        el.style.setProperty("--fit", String(scale))
      })
    }

    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [width, height])

  return ref
}
