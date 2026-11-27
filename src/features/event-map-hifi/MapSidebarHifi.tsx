"use client"

import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"

import styles from "./MapSidebarHifi.module.css"
import { ArrowLeftIcon, SearchIcon } from "./CategoryIcons"
import CategoryRow from "./CategoryRow"
import MapPlaceCard from "./MapPlaceCard"
import MapPlaceDetail from "./MapPlaceDetail"
import { MAP_TABS, type MapTab } from "./mapFilters"
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
  const {
    categories,
    openCategory,
    openPlace,
    places,
    query,
    setQuery,
    results,
    openCategoryBy,
    openPlaceBy,
    backToCategories,
    backToPlaces,
  } = browse
  const searching = query.trim() !== ""

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
          type="search"
          className={styles.searchInput}
          placeholder="Mau ke mana?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari lokasi"
        />
        {query ? (
          <button
            type="button"
            className={styles.searchClear}
            aria-label="Hapus pencarian"
            onClick={() => setQuery("")}
          >
            <X aria-hidden="true" />
          </button>
        ) : (
          <SearchIcon className={styles.searchIcon} />
        )}
      </div>

      {openPlace ? (
        <MapPlaceDetail location={openPlace} onBack={backToPlaces} onNavigate={onNavigate} />
      ) : searching ? (
        results.length > 0 ? (
          <ul className={styles.cards} aria-label="Hasil pencarian">
            {results.map((place) => (
              <li key={place.id}>
                <MapPlaceCard location={place} onSelect={openPlaceBy} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Tidak ada lokasi yang cocok dengan &ldquo;{query.trim()}&rdquo;.</p>
        )
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
          {categories.map((category) => (
            <li key={category.id}>
              <CategoryRow category={category} onSelect={openCategoryBy} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
