"use client"

import { useState } from "react"
import Image from "next/image"
import useImpression from "@/lib/analytics/hooks/useImpression"
import trackClick from "@/lib/analytics/trackClick"
import styles from "./MediaPartnersSectionHifi.module.css"
import { MEDIA_PARTNERS as mediaPartners, MEDIA_PARTNERS_SECTION_ID, TIER_WIDTH, sponsorId } from "./partners"

// Duplicate untuk seamless loop
const duplicated = [...mediaPartners, ...mediaPartners, ...mediaPartners]

export default function MediaPartnersSectionHifi() {
  const [paused, setPaused] = useState(false)
  // One impression for the whole marquee once it has been on screen for a second: logos scroll
  // past, so per-logo impressions would mostly measure animation speed.
  const impressionRef = useImpression({
    sectionId: MEDIA_PARTNERS_SECTION_ID,
    division: "SP",
    eventName: "sponsor_impression",
    minVisibleMs: 1000, // Standard 1s of impression
  })

  return (
    <section ref={impressionRef} className={styles.section}>
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
                onClick={() => trackClick("sponsor_click", { sponsorId: sponsorId(partner), tier: partner.tier })}
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
