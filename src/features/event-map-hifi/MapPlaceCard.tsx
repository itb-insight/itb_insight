import Image from "next/image"
import { Star } from "lucide-react"

import styles from "./MapPlaceCard.module.css"
import { MAP_PIN, pinForCategory } from "./mapCategories"
import type { MapLocation } from "./mapLocations"
import PlaceLogos from "./PlaceLogos"
import PlaceName from "./PlaceName"

interface MapPlaceCardProps {
  location: MapLocation
  onSelect?: (location: MapLocation) => void
}

/** Categories whose cards show the map pin in place of a photo. */
const PIN_THUMB_CATEGORIES = new Set(["parkir"])

export default function MapPlaceCard({ location, onSelect }: MapPlaceCardProps) {
  const pin = PIN_THUMB_CATEGORIES.has(location.category) ? pinForCategory(location.category) : null
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
      ) : location.logos?.length ? (
        <PlaceLogos logos={location.logos} variant="card" />
      ) : pin ? (
        <span className={styles.pinThumb}>
          {location.starred ? <Star className={styles.pinStar} aria-hidden="true" /> : null}
          <Image src={pin} alt="" width={MAP_PIN.width} height={MAP_PIN.height} loading="eager" />
        </span>
      ) : null}
      <span className={styles.content}>
        <span className={styles.title}>
          <PlaceName location={location} />
        </span>
        {location.description ? (
          <span className={styles.description}>{location.description}</span>
        ) : null}
      </span>
    </button>
  )
}
