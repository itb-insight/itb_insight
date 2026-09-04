"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import styles from "./GallerySectionHifi.module.css"

const slides = [
  { src: "/images/gallery-2015.webp", alt: "Gallery 2015" },
  { src: "/images/gallery-2017.webp", alt: "Gallery 2017" },
  { src: "/images/gallery-2019.webp", alt: "Gallery 2019" },
]

export default function GallerySectionHifi() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const dragStartX = useRef<number | null>(null)
  const isDragging = useRef(false)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

  const goTo = (index: number, dir: number) => {
    setDirection(dir)
    setCurrent((index + slides.length) % slides.length)
    resetAutoScroll()
  }

  const next = () => goTo(current + 1, 1)
  const prev = () => goTo(current - 1, -1)

  const resetAutoScroll = () => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    autoScrollRef.current = setInterval(next, 10000)
  }

  useEffect(() => {
    autoScrollRef.current = setInterval(next, 10000)
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
  }, [current])

  const onMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX
    isDragging.current = false
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return
    if (Math.abs(e.clientX - dragStartX.current) > 5) isDragging.current = true
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return
    const diff = e.clientX - dragStartX.current
    if (isDragging.current) {
      if (diff < -50) next()
      else if (diff > 50) prev()
    }
    dragStartX.current = null
    isDragging.current = false
  }

  const onTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX.current === null) return
    const diff = e.changedTouches[0].clientX - dragStartX.current
    if (diff < -50) next()
    else if (diff > 50) prev()
    dragStartX.current = null
  }

  return (
    <section className={styles.gallery}>
      <h2 className={styles.title}>GALLERY</h2>

      <div
        className={styles.carousel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, i) => {
          let offset = i - current
          if (offset > slides.length / 2) offset -= slides.length
          if (offset < -slides.length / 2) offset += slides.length

          const xPercent = offset * 107
          const isActive = offset === 0
          const isVisible = Math.abs(offset) <= 1

          return (
            <motion.div
              key={i}
              className={styles.card}
              animate={{
                x: `${xPercent}%`,
                opacity: isActive ? 1 : isVisible ? 1 : 0,
                zIndex: isActive ? 3 : 2,
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{
                position: "absolute",
                left: "50%",
                translateX: "-50%",
                width: "55%",
                aspectRatio: "1106 / 799",
                pointerEvents: isVisible ? "auto" : "none",
              }}
              onClick={() => {
                if (offset === -1) prev()
                if (offset === 1) next()
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes={isActive ? "55vw" : "20vw"}
                className={styles.cardImage}
                priority={isActive}
              />
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}