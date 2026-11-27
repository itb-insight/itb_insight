import Link from "next/link"

import styles from "./MapPlaceLinks.module.css"
import type { MapLink } from "./mapLocations"

interface MapPlaceLinksProps {
  links?: MapLink[]
  className?: string
}

/** Buttons to an event / competition page, shown in the place detail views. */
export default function MapPlaceLinks({ links, className }: MapPlaceLinksProps) {
  if (!links?.length) return null
  return (
    <div className={`${styles.links} ${className ?? ""}`}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={styles.link}>
          <span className={styles.label}>{link.label}</span>
          <span aria-hidden="true">→</span>
        </Link>
      ))}
    </div>
  )
}
