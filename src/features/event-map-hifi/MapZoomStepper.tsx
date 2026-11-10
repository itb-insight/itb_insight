import type { RefObject } from "react"
import type { MapRef } from "react-map-gl/maplibre"

import styles from "./MapZoomStepper.module.css"

interface MapZoomStepperProps {
  mapRef: RefObject<MapRef | null>
}

export default function MapZoomStepper({ mapRef }: MapZoomStepperProps) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.button}
        aria-label="Perbesar peta"
        onClick={() => mapRef.current?.zoomIn()}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 6v12M6 12h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <span className={styles.divider} aria-hidden="true" />

      <button
        type="button"
        className={styles.button}
        aria-label="Perkecil peta"
        onClick={() => mapRef.current?.zoomOut()}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
