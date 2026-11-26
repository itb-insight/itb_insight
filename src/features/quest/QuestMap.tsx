"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState, type CSSProperties } from "react"

import { ArrowLeftIcon, CheckIcon } from "./QuestIcons"
import shared from "./quest-shared.module.css"
import styles from "./QuestMap.module.css"

/*
 * Figma: halaman "Quest" > Section 2 > frame "Quest Map Layer" (2185:798), 402 x 852.
 *
 * Petanya masih denah sementara persis seperti di Figma (gedung, jalan, penanda).
 * Catatan desain: nanti diganti peta ITB, boleh berupa gambar dulu.
 * Semua posisi di bawah dalam piksel dari kiri atas frame 402 x 852.
 */

export interface QuestSpot {
  initials: string
  name: string
  /** Baris kecil di bawah nama. Spasi ganda di sekitar "|" sengaja, mengikuti Figma. */
  meta: string
  points: string
}

interface QuestMapProps {
  title?: string
  nearby?: string
  filters?: string[]
  spot?: QuestSpot
  backHref?: string
}

type Box = { x: number; y: number; w: number; h: number }

const BUILDINGS: (Box & { pill?: boolean })[] = [
  { x: 58, y: 222, w: 115, h: 92 },
  { x: 235, y: 223, w: 115, h: 92 },
  { x: 56, y: 382, w: 288, h: 72 },
  { x: 125, y: 486, w: 153, h: 80, pill: true },
]

const ROADS: Box[] = [
  { x: 0, y: 327, w: 403, h: 39 },
  { x: 182, y: 86, w: 39, h: 568 },
]

const TAGS: { x: number; y: number; label: string; tone: "green" | "pink" }[] = [
  { x: 82, y: 242, label: "A1", tone: "green" },
  { x: 120, y: 282, label: "2x", tone: "pink" },
  { x: 258, y: 242, label: "B2", tone: "green" },
  { x: 279, y: 406, label: "C1", tone: "green" },
  { x: 315, y: 520, label: "D4", tone: "green" },
]

const DOTS = [
  { x: 190, y: 514 },
  { x: 320, y: 287 },
]

const at = ({ x, y, w, h }: Partial<Box>): CSSProperties => ({
  left: x,
  top: y,
  width: w,
  height: h,
})

export default function QuestMap({
  title = "QUEST MAP",
  nearby = "15 open nearby",
  filters = ["All", "Booths", "Landmarks", "Events"],
  spot = { initials: "LM", name: "Kolam Intel", meta: "Landmark | ~120 m  |  QR + photo", points: "+80" },
  backHref = "/quest",
}: QuestMapProps) {
  const uid = useId().replace(/:/g, "")
  const [filter, setFilter] = useState(filters[0])
  const filtersRef = useRef<HTMLDivElement>(null)

  // Figma membulatkan lebar teks chip ke atas (19 / 49 / 75 / 47), browser tidak.
  // Tanpa ini tiap chip ~0.5px lebih sempit dan selisihnya menumpuk ke kanan.
  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled || !filtersRef.current) return
      filtersRef.current.querySelectorAll<HTMLElement>("[data-chip-text]").forEach((el) => {
        el.style.width = ""
        el.style.width = `${Math.ceil(el.getBoundingClientRect().width)}px`
      })
    })
    return () => {
      cancelled = true
    }
  }, [filters])

  return (
    <section className={styles.page} aria-label={title}>
      <div className={styles.grid} aria-hidden="true" />

      <div className={styles.canvas} aria-hidden="true">
        {BUILDINGS.map((b) => (
          <span key={`${b.x}-${b.y}`} className={`${styles.building} ${b.pill ? styles.buildingPill : ""}`} style={at(b)} />
        ))}
        {ROADS.map((r) => (
          <span key={`${r.x}-${r.y}`} className={styles.road} style={at(r)} />
        ))}

        {/* Penanda event: persegi 20 diputar 45° (kotak luarnya 28.3 di Figma). */}
        <span className={`${styles.diamond} ${shared.stroke}`} style={at({ x: 115.15, y: 408.15 })} />

        {/* Posisi pengguna */}
        <span className={styles.player} style={at({ x: 182, y: 399 })}>
          <span className={styles.playerCore} />
        </span>

        <svg className={styles.weak} style={at({ x: 274, y: 476 })} width="103" height="98" viewBox="0 0 103 98">
          <defs>
            <linearGradient id={`${uid}-weak-fill`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#ffacac" stopOpacity="0.5" />
              <stop offset="0.99" stopColor="#da5151" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id={`${uid}-weak-stroke`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#ffe4ec" />
              <stop offset="1" stopColor="#ffaaaa" />
            </linearGradient>
          </defs>
          <rect width="103" height="98" rx="5" fill={`url(#${uid}-weak-fill)`} />
          <rect
            x="0.5"
            y="0.5"
            width="102"
            height="97"
            rx="4.5"
            fill="none"
            stroke={`url(#${uid}-weak-stroke)`}
            strokeDasharray="4 4"
          />
        </svg>
        <span className={styles.weakLabel} style={at({ x: 287, y: 486, w: 77 })}>
          WEAK SIGNAL
        </span>

        {TAGS.map((t) => (
          <span
            key={t.label}
            className={`${styles.tag} ${t.tone === "pink" ? styles.tagPink : styles.tagGreen} ${shared.stroke}`}
            style={at({ x: t.x, y: t.y })}
          >
            <span className={shared.textNavy}>{t.label}</span>
          </span>
        ))}

        {DOTS.map((d) => (
          <span key={`${d.x}-${d.y}`} className={styles.dot} style={at(d)} />
        ))}

        <span className={styles.done} style={at({ x: 191, y: 158 })}>
          <CheckIcon uid={`${uid}-done`} />
        </span>
      </div>

      <header className={`${styles.bar} ${shared.frameBg} ${shared.stroke}`}>
        <Link href={backHref} className={styles.back} aria-label="Kembali">
          <ArrowLeftIcon />
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.nearby}>{nearby}</p>
      </header>

      <div ref={filtersRef} className={styles.filters} role="group" aria-label="Filter">
        {filters.map((label) => {
          const selected = label === filter
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(label)}
              className={`${styles.chip} ${selected ? styles.chipActive : shared.stroke}`}
            >
              <span className={styles.chipText} data-chip-text>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      <div className={`${styles.spot} ${shared.stroke}`}>
        <span className={`${styles.spotAvatar} ${shared.stroke}`}>
          <span className={shared.textNavy}>{spot.initials}</span>
        </span>
        <div className={styles.spotInfo}>
          <p className={styles.spotName}>{spot.name}</p>
          <p className={styles.spotMeta}>{spot.meta}</p>
        </div>
        <p className={styles.spotPoints}>{spot.points}</p>
      </div>

    </section>
  )
}
