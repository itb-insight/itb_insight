"use client"

import { useCallback, useRef, useState } from "react"
import type { MapRef } from "react-map-gl/maplibre"

import styles from "./EventMapHifi.module.css"
import MapBottomSheet from "./MapBottomSheet"
import MapCanvasHifi from "./MapCanvasHifi"
import type { MapTab } from "./mapFilters"
import type { MapLocation } from "./mapLocations"
import MapNavbarHifi from "./MapNavbarHifi"
import MapSidebarHifi from "./MapSidebarHifi"
import { sheetHeights, type SheetSnap } from "./sheetSnap"
import { useMapBrowse } from "./useMapBrowse"

const FOCUS_ZOOM = 18.5
const MOBILE_QUERY = "(max-width: 899px)" // same breakpoint as EventMapHifi.module.css

const isMobile = () => window.matchMedia(MOBILE_QUERY).matches

export default function EventMapHifi() {
  const mapRef = useRef<MapRef>(null)
  const [activeTab, setActiveTab] = useState<MapTab>("All")
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half")
  const browse = useMapBrowse(activeTab)

  // The map only moves when the user presses Navigate. MapLibre jumps instead of animating when
  // the user prefers reduced motion.
  const navigate = useCallback(
    (location: MapLocation) => {
      const map = mapRef.current
      if (!map) return
      let offsetY = 0
      if (isMobile()) {
        // A full sheet hides the map: drop it to half, then centre the place above it.
        const snap = sheetSnap === "full" ? "half" : sheetSnap
        if (snap !== sheetSnap) setSheetSnap(snap)
        offsetY = -sheetHeights(map.getContainer().clientHeight)[snap] / 2
      }
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
        offset: [0, offsetY],
        duration: 1200,
      })
    },
    [sheetSnap],
  )

  // Tapping a pin opens its details; on mobile, make sure the sheet is open to show them.
  const selectFromMap = useCallback(
    (location: MapLocation) => {
      browse.showPlace(location)
      if (isMobile() && sheetSnap === "closed") setSheetSnap("half")
    },
    [browse, sheetSnap],
  )

  const search = useCallback(
    (query: string) => {
      browse.setQuery(query)
      if (query.trim() && sheetSnap === "closed") setSheetSnap("half")
    },
    [browse, sheetSnap],
  )

  return (
    <main className={styles.page}>
      <div className={styles.mobileOnly}>
        <MapNavbarHifi
          activeTab={activeTab}
          onTabChange={setActiveTab}
          query={browse.query}
          onQueryChange={search}
        />
      </div>

      <div className={styles.desktopOnly}>
        <MapSidebarHifi
          browse={browse}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNavigate={navigate}
        />
      </div>

      <MapCanvasHifi
        mapRef={mapRef}
        tab={activeTab}
        activeLocationId={browse.openPlace?.id ?? null}
        onSelectLocation={selectFromMap}
      />

      <div className={styles.mobileOnly}>
        <MapBottomSheet browse={browse} snap={sheetSnap} onSnapChange={setSheetSnap} onNavigate={navigate} />
      </div>
    </main>
  )
}
