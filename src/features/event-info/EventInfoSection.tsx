"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./EventInfoSection.module.css"

const RING_RADIUS = 160
const CARD_COUNT = 8

const events = [
  { title: "Exhibition", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
  { title: "Seminar", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.headerText}>Event Info</span>
      </div>

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
            return (
              <motion.div
                key={i}
                className={styles.ringCard}
                animate={{ x: pos.x, y: pos.y }}
                transition={phase === "zoom"
                  ? { duration: 0.6, ease: "easeInOut" } // ← smooth saat scroll
                  : { duration: 0 }
                }
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