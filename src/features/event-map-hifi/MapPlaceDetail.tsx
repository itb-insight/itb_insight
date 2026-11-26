import Image from "next/image"

import styles from "./MapPlaceDetail.module.css"
import { ArrowLeftIcon } from "./CategoryIcons"
import MapPlaceLinks from "./MapPlaceLinks"
import type { MapLocation } from "./mapLocations"

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

      {location.detailImage ? (
        <Image
          src={location.detailImage}
          alt=""
          width={454}
          height={259}
          sizes="454px"
          loading="eager"
          className={styles.image}
        />
      ) : null}

      {location.about ? <p className={styles.about}>{location.about}</p> : null}

      <MapPlaceLinks links={location.links} className={styles.links} />

      <button type="button" className={styles.navigate} onClick={() => onNavigate?.(location)}>
        Navigate
      </button>
    </>
  )
}
