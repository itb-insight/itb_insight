"use client"

import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"

import styles from "./MapNavbarHifi.module.css"
import { SearchIcon } from "./CategoryIcons"
import { MAP_TABS, type MapTab } from "./mapFilters"

interface MapNavbarHifiProps {
  activeTab: MapTab
  onTabChange: (tab: MapTab) => void
  query: string
  onQueryChange: (query: string) => void
}

/** Mobile header: logo + search on the first row, filter tabs on the second. */
export default function MapNavbarHifi({ activeTab, onTabChange, query, onQueryChange }: MapNavbarHifiProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.top}>
        {/* Satu-satunya jalan keluar dari peta: logo kembali ke landing. */}
        <Link href="/" className={styles.logoLink} aria-label="Kembali ke beranda">
          <Image
            src="/images/logoinsight-hifi.png"
            alt="ITB Insight"
            width={32}
            height={31}
            className={styles.logo}
            priority
          />
        </Link>

        <label className={styles.search}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Mau ke mana?"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Cari lokasi"
            enterKeyHint="search"
          />
          {query ? (
            <button
              type="button"
              className={styles.searchClear}
              aria-label="Hapus pencarian"
              onClick={() => onQueryChange("")}
            >
              <X aria-hidden="true" />
            </button>
          ) : (
            <SearchIcon className={styles.searchIcon} />
          )}
        </label>
      </div>

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
    </nav>
  )
}
