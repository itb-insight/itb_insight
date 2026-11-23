"use client"

import { useEffect, useId, useRef, useState } from "react"
import RangeTabs, { type TabOption } from "@/features/admin/components/RangeTabs/RangeTabs"
import WidgetCard from "@/features/admin/components/WidgetCard/WidgetCard"
import type { RangeKey } from "@/features/admin/data/timeRange"
import styles from "./LineChartWidget.module.css"

export interface LineSeries {
  name: string
  values: number[]
  /** default dari SERIES_COLORS sesuai urutan */
  color?: string
}

export interface LineStat {
  label: string
  value: string
}

interface LineChartWidgetProps<T extends string = RangeKey> {
  title: string
  description?: string
  /** label sumbu-x, satu per bucket (mis. "08.00") */
  labels: string[]
  series: LineSeries[]
  /** angka besar di atas grafik (varian "Line chart 1") */
  stats?: LineStat[]
  /**
   * Gambar isinya saja, tanpa WidgetCard.
   *
   * Dipakai panel "Engagement" di /admin/sponsor, yang memuat DUA grafik di
   * dalam satu kartu — jadi kartunya dipasang di luar, sekali saja.
   */
  bare?: boolean
  /** Tanpa range + onRangeChange, tab rentang waktunya tidak digambar. */
  range?: T
  onRangeChange?: (range: T) => void
  /**
   * Pilihan tab. Tanpa ini dipakai rentang waktu D-Day (30 min sampai 12 jam).
   * Grafik "Kunjungan" di /admin/web memakai 14 hari / 30 hari / Total.
   */
  rangeOptions?: readonly TabOption<T>[]
  /** area gradient di bawah garis; default true kalau cuma 1 series */
  area?: boolean
  /** satuan di tooltip, mis. "check-in" */
  unit?: string
  height?: number
  emptyText?: string
}

/**
 * Urutan warna dari token Figma "Line chart 2":
 * yellow/default (Gate A), info blue/300 (Gate B), purple/400 (Gate C), green/default (Gate D).
 * Dua sisanya cadangan kalau gate-nya lebih dari empat.
 */
export const SERIES_COLORS = ["#fad500", "#54b8ff", "#c095eb", "#6ccb59", "#ff8a7a", "#f2a65a"]
const SINGLE_COLOR = "#acc7ff"

const M = { top: 10, right: 8, bottom: 28, left: 40 }

/** Pembulatan ke atas ke angka "enak" (1, 2, 2.5, 5 × 10^k) supaya tick sumbu-y rapi. */
function niceStep(raw: number) {
  if (raw <= 0) return 1
  const exp = Math.floor(Math.log10(raw))
  const base = raw / 10 ** exp
  const nice = base <= 1 ? 1 : base <= 2 ? 2 : base <= 2.5 ? 2.5 : base <= 5 ? 5 : 10
  return nice * 10 ** exp
}

const fmt = (n: number) => n.toLocaleString("id-ID")

export default function LineChartWidget<T extends string = RangeKey>({
  title,
  description,
  labels,
  series,
  stats,
  bare = false,
  range,
  onRangeChange,
  rangeOptions,
  area,
  unit,
  height = 258,
  emptyText = "Belum ada data di rentang ini",
}: LineChartWidgetProps<T>) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const gradId = useId().replace(/:/g, "")

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const isSingle = series.length === 1
  const showArea = area ?? isSingle
  const colored = series.map((s, i) => ({
    ...s,
    color: s.color ?? (isSingle ? SINGLE_COLOR : SERIES_COLORS[i % SERIES_COLORS.length]),
  }))

  const n = labels.length
  const dataMax = Math.max(0, ...series.flatMap((s) => s.values))
  const step = niceStep(dataMax / 5)
  const yMax = Math.max(step * 5, 5)
  const ticks = Array.from({ length: 6 }, (_, i) => (yMax / 5) * (5 - i))
  const isEmpty = dataMax === 0

  const plotW = Math.max(0, width - M.left - M.right)
  const plotH = height - M.top - M.bottom
  const colW = n > 0 ? plotW / n : 0
  // Titik di tengah kolom (seperti Figma: label jam di bawah tiap titik)
  const xAt = (i: number) => M.left + (i + 0.5) * colW
  const yAt = (v: number) => M.top + (1 - v / yMax) * plotH

  const paths = colored.map((s) => {
    const pts = s.values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
    const line = `M${pts.join("L")}`
    const areaPath = `${line}L${xAt(n - 1).toFixed(1)},${yAt(0)}L${xAt(0).toFixed(1)},${yAt(0)}Z`
    return { line, area: areaPath }
  })

  // Label sumbu-x dijarangkan kalau sempit (<44px per label)
  const labelEvery = colW > 0 ? Math.max(1, Math.ceil(44 / colW)) : 1

  const pickIndex = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect || colW === 0) return null
    const i = Math.floor((clientX - rect.left - M.left) / colW)
    return i >= 0 && i < n ? i : null
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1))
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1))
    else if (e.key === "Escape") setHover(null)
    else return
    e.preventDefault()
  }

  const summary = `${title}: ${colored
    .map((s) => `${s.name} total ${fmt(s.values.reduce((a, b) => a + b, 0))}`)
    .join(", ")}`

  const tooltipLeft = hover !== null ? xAt(hover) : 0
  const tooltipFlip = hover !== null && tooltipLeft > width - 180

  /* Tanpa kartu, legenda tetap digambar walau cuma satu garis — di panel
     Engagement justru legenda itulah yang menamai tiap grafiknya. */
  const tampilkanLegenda = bare ? colored.some((s) => s.name) : !isSingle

  const isi = (
    <>
      {stats && stats.length > 0 && (
        <dl className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt className={styles.statLabel}>{s.label}</dt>
              <dd className={styles.statValue}>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {tampilkanLegenda && (
        <ul className={styles.legend}>
          {colored.map((s) => (
            <li key={s.name} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: s.color }} aria-hidden />
              {s.name}
            </li>
          ))}
        </ul>
      )}

      <div
        ref={wrapRef}
        className={styles.chart}
        style={{ height }}
        tabIndex={0}
        role="img"
        aria-label={summary}
        onPointerMove={(e) => setHover(pickIndex(e.clientX))}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={onKey}
      >
        {width > 0 && (
          <svg width={width} height={height} className={styles.svg} aria-hidden>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SINGLE_COLOR} stopOpacity={0.45} />
                <stop offset="100%" stopColor={SINGLE_COLOR} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            {/* grid horizontal + label sumbu-y */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={M.left + plotW}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  className={t === 0 ? styles.axis : styles.grid}
                />
                <text x={M.left - 8} y={yAt(t)} className={styles.yLabel}>
                  {fmt(t)}
                </text>
              </g>
            ))}

            {/* grid vertikal di batas kolom */}
            {Array.from({ length: n + 1 }, (_, i) => (
              <line
                key={i}
                x1={M.left + i * colW}
                x2={M.left + i * colW}
                y1={M.top}
                y2={M.top + plotH}
                className={styles.grid}
              />
            ))}

            {labels.map((l, i) =>
              i % labelEvery === 0 ? (
                /* key = indeks saja. `l + i` bertabrakan kalau panjang labelnya
                   tidak seragam: "H-11" + 0 dan "H-1" + 10 sama-sama "H-110". */
              <text key={i} x={xAt(i)} y={height - 8} className={styles.xLabel}>
                  {l}
                </text>
              ) : null,
            )}

            {hover !== null && (
              <line x1={xAt(hover)} x2={xAt(hover)} y1={M.top} y2={M.top + plotH} className={styles.cursor} />
            )}

            {!isEmpty &&
              colored.map((s, si) => (
                <g key={s.name}>
                  {showArea && <path d={paths[si].area} fill={`url(#${gradId})`} />}
                  <path d={paths[si].line} className={styles.line} stroke={s.color} />
                  {(isSingle || hover !== null) &&
                    s.values.map((v, i) =>
                      isSingle || i === hover ? (
                        <g key={i}>
                          <circle
                            cx={xAt(i)}
                            cy={yAt(v)}
                            r={i === hover ? 10 : 8}
                            fill={s.color}
                            opacity={0.35}
                          />
                          <circle cx={xAt(i)} cy={yAt(v)} r={4} fill="#dee8fb" stroke={s.color} strokeWidth={2} />
                        </g>
                      ) : null,
                    )}
                </g>
              ))}
          </svg>
        )}

        {isEmpty && <p className={styles.empty}>{emptyText}</p>}

        {hover !== null && !isEmpty && (
          <div
            className={styles.tooltip}
            style={{
              left: tooltipLeft,
              transform: tooltipFlip ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className={styles.tooltipTitle}>{labels[hover]}</p>
            {colored.map((s) => (
              <p key={s.name} className={styles.tooltipRow}>
                <span className={styles.legendDot} style={{ background: s.color }} aria-hidden />
                <span className={styles.tooltipName}>{s.name}</span>
                <strong>
                  {fmt(s.values[hover] ?? 0)}
                  {unit ? ` ${unit}` : ""}
                </strong>
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  )

  if (bare) return <div className={styles.bare}>{isi}</div>

  return (
    <WidgetCard
      title={title}
      description={description}
      action={
        range && onRangeChange ? (
          <RangeTabs
            value={range}
            onChange={onRangeChange}
            options={rangeOptions}
            label={`Rentang waktu ${title}`}
          />
        ) : undefined
      }
    >
      {isi}
    </WidgetCard>
  )
}
