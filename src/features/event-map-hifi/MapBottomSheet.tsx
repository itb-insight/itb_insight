"use client"

import { useState } from "react"
import Image from "next/image"

import styles from "./MapBottomSheet.module.css"
import { ArrowLeftIcon } from "./CategoryIcons"
import CategoryRow from "./CategoryRow"
import MapPlaceCard from "./MapPlaceCard"
import { MAP_CATEGORIES } from "./mapCategories"
import { MAP_PLACEHOLDER_DETAIL_IMAGE, type MapLocation } from "./mapLocations"
import type { MapBrowse } from "./useMapBrowse"

interface MapBottomSheetProps {
  browse: MapBrowse
  onNavigate?: (location: MapLocation) => void
}

export default function MapBottomSheet({ browse, onNavigate }: MapBottomSheetProps) {
  const { openCategory, openPlace, places, openCategoryBy, openPlaceBy, backToCategories, backToPlaces } =
    browse
  const [expanded, setExpanded] = useState(true)

  return (
    <section className={`${styles.sheet} ${expanded ? "" : styles.collapsed}`}>
      <button
        type="button"
        className={styles.handle}
        aria-expanded={expanded}
        aria-label={expanded ? "Kecilkan panel" : "Besarkan panel"}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={styles.handleBar} />
      </button>

      <div className={styles.body}>
        {openPlace ? (
          <>
            <div className={styles.head}>
              <div className={styles.heading}>
                <h2 className={styles.title}>{openPlace.name}</h2>
                {openPlace.description ? (
                  <p className={styles.subtitle}>{openPlace.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.back}
                aria-label="Kembali"
                onClick={backToPlaces}
              >
                <ArrowLeftIcon className={styles.backIcon} />
              </button>
            </div>

            <button
              type="button"
              className={styles.navigate}
              onClick={() => onNavigate?.(openPlace)}
            >
              Navigate
            </button>

            <Image
              src={openPlace.detailImage ?? MAP_PLACEHOLDER_DETAIL_IMAGE}
              alt=""
              width={393}
              height={259}
              className={styles.image}
              loading="eager"
            />
          </>
        ) : openCategory ? (
          <>
            <div className={styles.head}>
              <div className={styles.heading}>
                <h2 className={styles.title}>{openCategory.label}</h2>
              </div>
              <button
                type="button"
                className={styles.back}
                aria-label="Kembali"
                onClick={backToCategories}
              >
                <ArrowLeftIcon className={styles.backIcon} />
              </button>
            </div>

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
      </div>
    </section>
  )
}
