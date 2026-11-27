"use client"

import { useCallback, useRef, useState } from "react"
import type { MapRef } from "react-map-gl/maplibre"

import styles from "./EventMapHifi.module.css"
import MapBottomSheet from "./MapBottomSheet"
import MapCanvasHifi from "./MapCanvasHifi"
import { resolveMapDeepLink } from "./mapDeepLink"
import MapNotice from "./MapNotice"
import type { MapTab } from "./mapFilters"
import type { MapLocation } from "./mapLocations"
import MapNavbarHifi from "./MapNavbarHifi"
import MapSidebarHifi from "./MapSidebarHifi"
import { sheetHeights, type SheetSnap } from "./sheetSnap"
import { useMapBrowse } from "./useMapBrowse"
import { useUserLocation, type LocateResult } from "./useUserLocation"
import { isNearEventArea } from "./venueLayout"

const FOCUS_ZOOM = 18.5
const MOBILE_QUERY = "(max-width: 899px)" // same breakpoint as EventMapHifi.module.css

const isMobile = () => window.matchMedia(MOBILE_QUERY).matches

const LOCATE_ERRORS: Record<Extract<LocateResult, { ok: false }>["reason"], string> = {
  denied: "Izin lokasi diblokir. Izinkan lokasi untuk situs ini di pengaturan browser, lalu coba lagi.",
  unavailable: "Lokasimu belum bisa ditemukan. Pastikan GPS aktif, lalu coba lagi.",
  unsupported: "Browser ini tidak bisa membagikan lokasi.",
}

const OUT_OF_RANGE =
  "Kamu berada lebih dari 1 km dari area ITB INSIGHT, jadi lokasimu tidak ditampilkan di peta."

export default function EventMapHifi() {
  const mapRef = useRef<MapRef>(null)
  const [activeTab, setActiveTab] = useState<MapTab>("All")
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half")
  const [notice, setNotice] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const { position, locate } = useUserLocation()
  // The location is only used inside the event area or within 1 km of it (venueLayout.ts).
  const youStatus = position === null ? "unknown" : isNearEventArea(position) ? "near" : "far"

  // The map only moves when the user presses Navigate (or "Temukan aku"). MapLibre jumps instead
  // of animating when the user prefers reduced motion.
  const navigate = useCallback(
    (location: { lat: number; lng: number }) => {
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

  // "Temukan aku": asks for permission again if needed, then flies to the visitor.
  const locateMe = useCallback(async () => {
    setLocating(true)
    setNotice(null)
    const result = await locate()
    setLocating(false)
    if (!result.ok) setNotice(LOCATE_ERRORS[result.reason])
    else if (!isNearEventArea(result.position)) setNotice(OUT_OF_RANGE)
    else navigate(result.position)
  }, [locate, navigate])

  const browse = useMapBrowse(activeTab, locateMe, youStatus)

  // Tapping a pin opens its details; on mobile, make sure the sheet is open to show them.
  const selectFromMap = useCallback(
    (location: MapLocation) => {
      browse.showPlace(location)
      if (isMobile() && sheetSnap === "closed") setSheetSnap("half")
    },
    [browse, sheetSnap],
  )

  // Footer links like /event-map?place=stage open that place and fly to it right away;
  // ?category=parkir opens that section. The URL is left as is so the link can be shared.
  const followDeepLink = useCallback(() => {
    const link = resolveMapDeepLink(window.location.search)
    if (!link) return
    if ("place" in link) {
      browse.showPlace(link.place)
      navigate(link.place)
    } else {
      browse.openCategoryBy(link.category)
    }
  }, [browse, navigate])

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
        userPosition={youStatus === "near" ? position : null}
        onSelectLocation={selectFromMap}
        onMapLoad={followDeepLink}
      />

      <div className={styles.mobileOnly}>
        <MapBottomSheet
          browse={browse}
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          onNavigate={navigate}
          onLocate={locateMe}
          locating={locating}
        />
      </div>

      {notice ? <MapNotice message={notice} onDismiss={() => setNotice(null)} /> : null}
    </main>
  )
}
