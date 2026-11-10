"use client"

import { useState } from "react"

import styles from "./EventMapHifi.module.css"
import MapBottomSheet from "./MapBottomSheet"
import MapCanvasHifi from "./MapCanvasHifi"
import MapNavbarHifi from "./MapNavbarHifi"
import MapSidebarHifi from "./MapSidebarHifi"
import type { MapTab } from "./mapCategories"
import type { MapLocation } from "./mapLocations"
import { useMapBrowse } from "./useMapBrowse"

export default function EventMapHifi() {
  const browse = useMapBrowse()
  const [activeTab, setActiveTab] = useState<MapTab>("All")
  const [target, setTarget] = useState<MapLocation | null>(null)

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
          onNavigate={setTarget}
        />
      </div>

      <MapCanvasHifi activeLocationId={target?.id ?? null} />

      <div className={styles.mobileOnly}>
        <MapBottomSheet browse={browse} onNavigate={setTarget} />
      </div>
    </main>
  )
}
