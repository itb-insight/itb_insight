import Image from "next/image"

import styles from "./MapPlaceDetail.module.css"
import { ArrowLeftIcon } from "./CategoryIcons"
import {
  MAP_PLACEHOLDER_ABOUT,
  MAP_PLACEHOLDER_DETAIL_IMAGE,
  type MapLocation,
} from "./mapLocations"

interface MapPlaceDetailProps {
  location: MapLocation
  onBack: () => void
  onNavigate?: (location: MapLocation) => void
}

export default function MapPlaceDetail({ location, onBack, onNavigate }: MapPlaceDetailProps) {
  return (
    <>
      <div className={styles.head}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{location.name}</h2>
          {location.description ? (
            <p className={styles.subtitle}>{location.description}</p>
          ) : null}
        </div>

        <button type="button" className={styles.back} onClick={onBack} aria-label="Kembali">
          <ArrowLeftIcon className={styles.backIcon} />
        </button>
      </div>

      <Image
        src={location.detailImage ?? MAP_PLACEHOLDER_DETAIL_IMAGE}
        alt=""
        width={454}
        height={259}
        className={styles.image}
        loading="eager"
      />

      <p className={styles.about}>{location.about ?? MAP_PLACEHOLDER_ABOUT}</p>

      <button type="button" className={styles.navigate} onClick={() => onNavigate?.(location)}>
        Navigate
      </button>
    </>
  )
}
