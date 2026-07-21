"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./EventInfoSection.module.css"
import Navbar from "@/shared/components/Navbar/Navbar"

const RING_RADIUS = 160
const CARD_COUNT = 8

const events = [
  { title: "Exhibition", description: "Walk the floor and see what student teams have been building all year — robotics, software, and hardware prototypes on display and ready to demo.", href: "/exhibition" },
  { title: "Seminar", description: "Hear from industry practitioners and researchers in a series of short talks on where technology and engineering are headed next.", href: "/seminar" },
]

type Phase = "ring" | "zoom"

export default function EventInfoSection() {
  const [phase, setPhase] = useState<Phase>("ring")
  const [angle, setAngle] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [angleOffset, setAngleOffset] = useState(0)

  useEffect(() => {
    const original = document.body.style.backgroundColor
    document.body.style.backgroundColor = "#D9D9D9"
    return () => { document.body.style.backgroundColor = original }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setAngle(a => a + 0.5)
    }, 16)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setPhase("zoom")
    }, 3000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

useEffect(() => {
  if (phase !== "zoom") return
  let lastScroll = 0
  const handleScroll = (e: WheelEvent) => {
    const now = Date.now()
    if (now - lastScroll < 800) return
    lastScroll = now

    const step = 360 / CARD_COUNT

    if (e.deltaY > 0 && activeIndex < events.length - 1) {
      // Scroll down — hanya kalau belum di item terakhir
      setActiveIndex(i => i + 1)
      setAngleOffset(a => a - step)
    } else if (e.deltaY < 0 && activeIndex > 0) {
      // Scroll up — hanya kalau belum di item pertama
      setActiveIndex(i => i - 1)
      setAngleOffset(a => a + step)
    }
  }
  window.addEventListener("wheel", handleScroll)
  return () => window.removeEventListener("wheel", handleScroll)
}, [phase, activeIndex])

  const getCardPosition = (index: number) => {
   const baseAngle = (index / CARD_COUNT) * 2 * Math.PI
   const currentAngle = baseAngle + (angle * Math.PI / 180) + (angleOffset * Math.PI / 180)
   return {
     x: Math.cos(currentAngle) * RING_RADIUS,
     y: Math.sin(currentAngle) * RING_RADIUS,
   }
 }

 const router = useRouter()
 const isHighlighted = (pos: { x: number; y: number }) =>
   phase === "zoom" && Math.abs(pos.x - RING_RADIUS) < 15 && Math.abs(pos.y) < 15

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <div className={styles.content}>
        {/* Ring — tidak berubah apapun saat scroll */}
        <motion.div
          className={styles.ring}
          animate={phase === "zoom"
            ? { x: "-55vw", scale: 4 }
            : { x: 0, scale: 1 }
          }
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {Array.from({ length: CARD_COUNT }, (_, i) => {
            const pos = getCardPosition(i)
            const highlighted = isHighlighted(pos)

            return (
              <motion.div
                key={i}
                className={`${styles.ringCard} ${highlighted ? styles.ringCardClickable : ""}`}
                animate={{ x: pos.x, y: pos.y }}
                transition={phase === "zoom" ? { duration: 0.6, ease: "easeInOut" } : { duration: 0 }}
                onClick={highlighted ? () => router.push(events[activeIndex].href) : undefined}
              />
            )
          })}
        </motion.div>

        {/* Text panel — hanya ini yang berubah saat scroll */}
        <AnimatePresence mode="wait">
          {phase === "zoom" && (
            <motion.div
              key={activeIndex}
              className={styles.textPanel}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <h2 className={styles.panelTitle}>
                {events[activeIndex].title}
              </h2>
              <p className={styles.panelDesc}>
                {events[activeIndex].description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}