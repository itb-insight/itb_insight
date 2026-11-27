"use client"

import { useRef, type PointerEvent as ReactPointerEvent } from "react"
import Image from "next/image"
import { LocateFixed } from "lucide-react"

import styles from "./MapBottomSheet.module.css"
import { ArrowLeftIcon } from "./CategoryIcons"
import CategoryRow from "./CategoryRow"
import MapPlaceCard from "./MapPlaceCard"
import PlaceLogos from "./PlaceLogos"
import MapPlaceLinks from "./MapPlaceLinks"
import type { MapLocation } from "./mapLocations"
import PlaceName from "./PlaceName"
import { nextSnapOnTap, pickSnap, sheetHeights, type SheetSnap } from "./sheetSnap"
import type { MapBrowse } from "./useMapBrowse"

interface MapBottomSheetProps {
  browse: MapBrowse
  snap: SheetSnap
  onSnapChange: (snap: SheetSnap) => void
  onNavigate?: (location: MapLocation) => void
  /** "Temukan aku": find the visitor and fly the map to them. */
  onLocate?: () => void
  locating?: boolean
}

const SNAP_CLASS: Record<SheetSnap, string> = {
  closed: styles.snapClosed,
  half: styles.snapHalf,
  full: styles.snapFull,
}

interface Drag {
  startY: number
  startHeight: number
  lastY: number
  lastTime: number
  velocity: number
  moved: boolean
  heights: Record<SheetSnap, number>
}

export default function MapBottomSheet({
  browse,
  snap,
  onSnapChange,
  onNavigate,
  onLocate,
  locating = false,
}: MapBottomSheetProps) {
  const {
    categories,
    openCategory,
    openPlace,
    places,
    query,
    results,
    openCategoryBy,
    openPlaceBy,
    backToCategories,
    backToPlaces,
  } = browse
  const searching = query.trim() !== ""

  const sheetRef = useRef<HTMLElement>(null)
  const drag = useRef<Drag | null>(null)
  const suppressClick = useRef(false)

  // Height under the navbar: the sheet's containing block minus --map-navbar-h.
  const measure = (sheet: HTMLElement) => {
    const page = (sheet.offsetParent as HTMLElement | null) ?? document.body
    const navbar = parseFloat(getComputedStyle(page).getPropertyValue("--map-navbar-h")) || 0
    return sheetHeights(page.clientHeight - navbar)
  }

  // While dragging, the height is written straight to the element (no re-render per move).
  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const sheet = sheetRef.current
    if (!sheet || (e.pointerType === "mouse" && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      startY: e.clientY,
      startHeight: sheet.getBoundingClientRect().height,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
      moved: false,
      heights: measure(sheet),
    }
    sheet.classList.add(styles.dragging)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    const sheet = sheetRef.current
    if (!d || !sheet) return
    const dy = d.startY - e.clientY
    if (Math.abs(dy) > 4) d.moved = true
    const height = Math.min(Math.max(d.startHeight + dy, d.heights.closed), d.heights.full)
    sheet.style.height = `${height}px`
    const dt = e.timeStamp - d.lastTime
    if (dt > 0) d.velocity = (d.lastY - e.clientY) / dt
    d.lastY = e.clientY
    d.lastTime = e.timeStamp
  }

  const onPointerEnd = () => {
    const d = drag.current
    const sheet = sheetRef.current
    drag.current = null
    if (!d || !sheet) return
    sheet.classList.remove(styles.dragging)
    if (!d.moved) {
      sheet.style.height = ""
      return // a tap: handled by onClick
    }
    suppressClick.current = true
    const height = sheet.getBoundingClientRect().height
    const target = pickSnap(height, d.velocity, d.heights)
    // Animate to the target in px; the inline height is dropped once the transition ends (or
    // right away when there is nothing to animate, since no transitionend would fire).
    sheet.style.height = Math.abs(height - d.heights[target]) < 1 ? "" : `${d.heights[target]}px`
    onSnapChange(target)
  }

  const onHandleClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    onSnapChange(nextSnapOnTap(snap))
  }

  return (
    <section
      ref={sheetRef}
      className={`${styles.sheet} ${SNAP_CLASS[snap]}`}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !drag.current) e.currentTarget.style.height = ""
      }}
    >
      {/* Sits on top of the sheet's edge; hidden when the sheet covers the map. */}
      {snap !== "full" ? (
        <button type="button" className={styles.locate} onClick={onLocate} disabled={locating}>
          <LocateFixed aria-hidden="true" className={styles.locateIcon} />
          {locating ? "Mencari…" : "Temukan aku"}
        </button>
      ) : null}

      <button
        type="button"
        className={styles.handle}
        aria-expanded={snap !== "closed"}
        aria-label={snap === "half" ? "Besarkan panel" : snap === "full" ? "Kecilkan panel" : "Buka panel"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={onHandleClick}
      >
        <span className={styles.handleBar} />
      </button>

      <div className={styles.body} inert={snap === "closed"}>
        {openPlace ? (
          <>
            <div className={styles.head}>
              <div className={styles.heading}>
                <h2 className={styles.title}>
                  <PlaceName location={openPlace} />
                </h2>
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

            {openPlace.about ? <p className={styles.about}>{openPlace.about}</p> : null}

            <MapPlaceLinks links={openPlace.links} className={styles.links} />

            {openPlace.detailImage ? (
              <Image
                src={openPlace.detailImage}
                alt=""
                width={393}
                height={259}
                sizes="100vw"
                loading="eager"
                className={styles.image}
              />
            ) : openPlace.logos?.length ? (
              <PlaceLogos logos={openPlace.logos} variant="detail" className={styles.logoBanner} />
            ) : null}
          </>
        ) : searching ? (
          <>
            <div className={styles.head}>
              <div className={styles.heading}>
                <h2 className={styles.title}>Hasil pencarian</h2>
              </div>
            </div>

            {results.length > 0 ? (
              <ul className={styles.cards}>
                {results.map((place) => (
                  <li key={place.id}>
                    <MapPlaceCard location={place} onSelect={openPlaceBy} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>Tidak ada lokasi yang cocok dengan &ldquo;{query.trim()}&rdquo;.</p>
            )}
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
            {categories.map((category) => (
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
