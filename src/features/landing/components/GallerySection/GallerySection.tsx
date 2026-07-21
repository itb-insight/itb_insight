"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./GallerySection.module.css"

const images = [
  { src: "/images/gallery-1.png", alt: "Visitors exploring the robotics exhibition floor" },
  { src: "/images/gallery-2.png", alt: "A student team pitching their prototype to judges" },
  { src: "/images/gallery-1.png", alt: "Crowd gathered around the main stage during a talk" },
  { src: "/images/gallery-2.png", alt: "Close-up of a competition entry on display" },
  { src: "/images/gallery-1.png", alt: "Attendees networking at the INSIGHT ITB booths" },
]

const slideVariants = {
  active:   { x: 0, scale: 1, opacity: 1, zIndex: 3 },
  left:     { x: -500, scale: 0.85, opacity: 1, zIndex: 2 },
  right:    { x: 500, scale: 0.85, opacity: 1, zIndex: 2 },
  farLeft:  { x: -800, scale: 0.7, opacity: 1, zIndex: 1 },
  farRight: { x: 800,  scale: 0.7, opacity: 1, zIndex: 1 },
}

export default function GallerySection() {
  const [current, setCurrent] = useState(2)
  const dragStartX = useRef<number | null>(null)
  const isDragging = useRef(false)

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)
  const getIndex = (offset: number) => (current + offset + images.length) % images.length

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

  const slides = [
    { offset: -2, variant: "farLeft",  onClick: prev },
    { offset: -1, variant: "left",     onClick: prev },
    { offset:  0, variant: "active",   onClick: undefined },
    { offset:  1, variant: "right",    onClick: next },
    { offset:  2, variant: "farRight", onClick: next },
  ]

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
        {slides.map(({ offset, variant, onClick }) => {
          const idx = getIndex(offset)
          return (
            <motion.div
              key={idx}
              className={`${styles.slide} ${styles[variant]}`}
              animate={slideVariants[variant as keyof typeof slideVariants]}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={onClick}
            >
              <Image
                src={images[idx].src}
                alt={images[idx].alt}
                fill
                sizes="(max-width: 768px) 80vw, 50vw"
                className={styles.img}
              />
            </motion.div>
          )
        })}
      </div>

      <div className={styles.dots}>
        {images.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}