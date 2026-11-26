import Image from "next/image"

import styles from "./MapPlaceCard.module.css"
import type { MapLocation } from "./mapLocations"

interface MapPlaceCardProps {
  location: MapLocation
  onSelect?: (location: MapLocation) => void
}

export default function MapPlaceCard({ location, onSelect }: MapPlaceCardProps) {
  return (
    <button type="button" className={styles.card} onClick={() => onSelect?.(location)}>
      {location.image ? (
        <Image
          src={location.image}
          alt=""
          width={120}
          height={84}
          sizes="120px"
          loading="eager"
          className={styles.image}
        />
      ) : null}
      <span className={styles.content}>
        <span className={styles.title}>{location.name}</span>
        {location.description ? (
          <span className={styles.description}>{location.description}</span>
        ) : null}
      </span>
    </button>
  )
}
