"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import styles from "./MediaPartnersSectionHifi.module.css"

const partners = [
  { src: "/images/partners/partner-1.webp", alt: "Partner 1" },
  { src: "/images/partners/partner-2.webp", alt: "Partner 2" },
  { src: "/images/partners/partner-3.webp", alt: "Partner 3" },
  { src: "/images/partners/partner-4.webp", alt: "Partner 4" },
]

// Duplicate untuk seamless loop
const duplicated = [...partners, ...partners, ...partners]

export default function MediaPartnersSectionHifi() {
  const [paused, setPaused] = useState(false)

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>MEDIA PARTNERS</h2>

      <div className={styles.marqueeWrapper}>
        <div
          className={styles.marqueeTrack}
          style={{ animationPlayState: paused ? "paused" : "running" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {duplicated.map((partner, i) => (
            <div key={i} className={styles.logoWrapper}>
              <Image
                src={partner.src}
                alt={partner.alt}
                fill
                sizes="200px"
                className={styles.logo}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}