"use client"

import Image from "next/image"
import Link from "next/link"

import styles from "./MapNavbarHifi.module.css"
import { SearchIcon } from "./CategoryIcons"
import { MAP_TABS, type MapTab } from "./mapCategories"

interface MapNavbarHifiProps {
  activeTab: MapTab
  onTabChange: (tab: MapTab) => void
  onSearch?: () => void
}

export default function MapNavbarHifi({ activeTab, onTabChange, onSearch }: MapNavbarHifiProps) {
  return (
    <nav className={styles.navbar}>
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

      <button type="button" className={styles.search} aria-label="Cari lokasi" onClick={onSearch}>
        <SearchIcon />
      </button>
    </nav>
  )
}
