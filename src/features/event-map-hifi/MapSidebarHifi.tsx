"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import styles from "./MapSidebarHifi.module.css"
import { ArrowLeftIcon, SearchIcon } from "./CategoryIcons"
import CategoryRow from "./CategoryRow"
import MapPlaceCard from "./MapPlaceCard"
import MapPlaceDetail from "./MapPlaceDetail"
import { MAP_CATEGORIES, MAP_TABS, type MapTab } from "./mapCategories"
import type { MapLocation } from "./mapLocations"
import type { MapBrowse } from "./useMapBrowse"

interface MapSidebarHifiProps {
  browse: MapBrowse
  activeTab: MapTab
  onTabChange: (tab: MapTab) => void
  onNavigate?: (location: MapLocation) => void
}

export default function MapSidebarHifi({
  browse,
  activeTab,
  onTabChange,
  onNavigate,
}: MapSidebarHifiProps) {
  const [query, setQuery] = useState("")
  const { openCategory, openPlace, places, openCategoryBy, openPlaceBy, backToCategories, backToPlaces } =
    browse

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        {/* Satu-satunya jalan keluar dari peta: logo kembali ke landing. */}
        <Link href="/" className={styles.logoLink} aria-label="Kembali ke beranda">
          <Image
            src="/images/logoinsight-hifi.png"
            alt="ITB Insight"
            width={48}
            height={47}
            className={styles.logo}
            priority
          />
        </Link>

        <div className={styles.tabs} role="tablist" aria-label="Filter peta">
          {MAP_TABS.map((tab) => {
            const active = tab === activeTab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                onClick={() => onTabChange(tab)}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.search}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Where do you want to go?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari lokasi"
        />
        <SearchIcon className={styles.searchIcon} />
      </div>

      {openPlace ? (
        <MapPlaceDetail location={openPlace} onBack={backToPlaces} onNavigate={onNavigate} />
      ) : openCategory ? (
        <>
          <button type="button" className={styles.back} onClick={backToCategories}>
            <ArrowLeftIcon className={styles.backIcon} />
            <span className={styles.backLabel}>Back</span>
          </button>

          {places.length > 0 ? (
            <ul className={styles.cards}>
              {places.map((place) => (
                <li key={place.id}>
                  <MapPlaceCard location={place} onSelect={openPlaceBy} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Belum ada lokasi di kategori ini.</p>
          )}
        </>
      ) : (
        <ul className={styles.list}>
          {MAP_CATEGORIES.map((category) => (
            <li key={category.id}>
              <CategoryRow category={category} onSelect={openCategoryBy} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
