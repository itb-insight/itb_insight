"use client"

import { useState } from "react"
import Image from "next/image"
import styles from "./MediaPartnersSectionHifi.module.css"

// Card width per size tier (the M/L/XL hint in each filename under public/media-partner).
const TIER_WIDTH = { M: 200, L: 220, XL: 260 } as const

type Tier = keyof typeof TIER_WIDTH

type MediaPartner = {
  /** File name inside public/media-partner */
  file: string
  alt: string
  tier: Tier
  /** Instagram handle without the "@". `null` = not linked yet (card is not clickable). */
  instagram: string | null
}

const mediaPartners: MediaPartner[] = [
  { file: "01. M_AIESEC in Bandung.png", alt: "AIESEC in Bandung", tier: "M", instagram: "aiesecbandung" },
  { file: "tecitb-logo.jpg", alt: "TEC ITB", tier: "M", instagram: "tec.itb" },
  { file: "03. M_SRE ITB.png", alt: "SRE ITB", tier: "M", instagram: "sreitb" },
  { file: "04. XL_Acara Bandung.png", alt: "Acara Bandung", tier: "XL", instagram: "acrbandung" },
  { file: "05. L_Young on Top Bandung.png", alt: "Young on Top Bandung", tier: "L", instagram: "yotbdg" },
  { file: "06. M_Para Pencari Event Bandung.png", alt: "Para Pencari Event Bandung", tier: "M", instagram: "papebandung" },
  { file: "07. M_ITB Receh.png", alt: "ITB Receh", tier: "M", instagram: "itb.receh" },
  { file: "08. M_ShARE ITB.png", alt: "ShARE ITB", tier: "M", instagram: "share_itb" },
  { file: "09. L_TSA ITB.png", alt: "TSA ITB", tier: "L", instagram: "tsaitb" },
  { file: "10. M_StudentsXCEOs International Summit.png", alt: "StudentsXCEOs International Summit", tier: "M", instagram: "studentsxceosbdg" },
  { file: "11. M_Strativate.png", alt: "Strativate", tier: "M", instagram: "strativate.id" },
]

// Duplicate untuk seamless loop
const duplicated = [...mediaPartners, ...mediaPartners, ...mediaPartners]

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
          {duplicated.map((partner, i) => {
            const isCopy = i >= mediaPartners.length
            const logo = (
              <Image
                // Filenames contain spaces/dots, so the URL must be encoded.
                src={`/media-partner/${encodeURIComponent(partner.file)}`}
                alt={isCopy ? "" : partner.alt}
                fill
                sizes="260px"
                className={styles.logo}
              />
            )
            const style = { width: TIER_WIDTH[partner.tier] }

            return partner.instagram ? (
              <a
                key={i}
                href={`https://www.instagram.com/${partner.instagram}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.logoWrapper} ${styles.clickable}`}
                style={style}
                aria-label={`${partner.alt} on Instagram (opens in a new tab)`}
                // Only the first copy is exposed to assistive tech / keyboard
                aria-hidden={isCopy || undefined}
                tabIndex={isCopy ? -1 : undefined}
              >
                {logo}
              </a>
            ) : (
              <div key={i} className={styles.logoWrapper} style={style} aria-hidden={isCopy || undefined}>
                {logo}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
