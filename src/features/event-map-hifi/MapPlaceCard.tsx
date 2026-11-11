import Image from "next/image"

import styles from "./MapPlaceCard.module.css"
import { MAP_PLACEHOLDER_IMAGE, type MapLocation } from "./mapLocations"

interface MapPlaceCardProps {
  location: MapLocation
  onSelect?: (location: MapLocation) => void
}

export default function MapPlaceCard({ location, onSelect }: MapPlaceCardProps) {
  return (
    <button type="button" className={styles.card} onClick={() => onSelect?.(location)}>
      <Image
        src={location.image ?? MAP_PLACEHOLDER_IMAGE}
        alt=""
        width={120}
        height={84}
        className={styles.image}
        loading="eager"
      />
      <span className={styles.content}>
        <span className={styles.title}>{location.name}</span>
        {location.description ? (
          <span className={styles.description}>{location.description}</span>
        ) : null}
      </span>
    </button>
  )
}
