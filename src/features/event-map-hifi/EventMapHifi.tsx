"use client"

import { useCallback, useRef, useState } from "react"
import type { MapRef } from "react-map-gl/maplibre"

import styles from "./EventMapHifi.module.css"
import MapBottomSheet from "./MapBottomSheet"
import MapCanvasHifi from "./MapCanvasHifi"
import MapNavbarHifi from "./MapNavbarHifi"
import MapSidebarHifi from "./MapSidebarHifi"
import type { MapTab } from "./mapCategories"
import type { MapLocation } from "./mapLocations"
import { useMapBrowse } from "./useMapBrowse"

const FOCUS_ZOOM = 18.5
const MOBILE_QUERY = "(max-width: 899px)" // same breakpoint as EventMapHifi.module.css
const SHEET_HEIGHT = 360

export default function EventMapHifi() {
  const mapRef = useRef<MapRef>(null)
  const [activeTab, setActiveTab] = useState<MapTab>("All")
  const [target, setTarget] = useState<MapLocation | null>(null)

  // Select a place and fly the map to it. MapLibre jumps instead of animating when the user
  // prefers reduced motion.
  const focus = useCallback((location: MapLocation) => {
    setTarget(location)
    const map = mapRef.current
    if (!map) return
    // On mobile the bottom sheet (360px, MapBottomSheet.module.css) covers the lower part of the
    // map, so centre the place in the visible area above it.
    const sheetOffset = window.matchMedia(MOBILE_QUERY).matches ? -SHEET_HEIGHT / 2 : 0
    map.flyTo({
      center: [location.lng, location.lat],
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
      offset: [0, sheetOffset],
      duration: 1200,
    })
  }, [])

  const browse = useMapBrowse(focus)

  return (
    <main className={styles.page}>
      <div className={styles.mobileOnly}>
        <MapNavbarHifi activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className={styles.desktopOnly}>
        <MapSidebarHifi
          browse={browse}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNavigate={focus}
        />
      </div>

      <MapCanvasHifi
        mapRef={mapRef}
        activeLocationId={target?.id ?? null}
        onSelectLocation={browse.showPlace}
      />

      <div className={styles.mobileOnly}>
        <MapBottomSheet browse={browse} onNavigate={focus} />
      </div>
    </main>
  )
}
