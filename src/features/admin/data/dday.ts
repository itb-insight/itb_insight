import type { Booth, BoothScanEvent, GateCheckIn } from "@/lib/types/database"
import {
  bucketize,
  bucketizeBy,
  getRange,
  windowStart,
  withinRange,
  type RangeKey,
} from "@/features/admin/data/timeRange"

/**
 * Adapter /admin/d-day: baris mentah Supabase → data siap pakai untuk
 * LineChartWidget & HeatmapWidget.
 *
 * Tipe baris diambil dari src/lib/types/database.ts, jadi route/page yang
 * nanti mengambil data cukup `select` kolom berikut lalu oper hasilnya ke sini:
 *   gate_check_ins     : user_id, gate_name, check_in_type, checked_in_at
 *   booth_scan_events  : user_id, booth_id, points_awarded, scanned_at
 *   booths             : id, name, coordinate_x (lng), coordinate_y (lat)
 */

export type GateCheckInRow = Pick<GateCheckIn, "user_id" | "gate_name" | "check_in_type" | "checked_in_at">

/** booth_id null = poin manual dari admin (migrasi 0012), tidak punya lokasi. */
export type BoothScanRow = Pick<BoothScanEvent, "user_id" | "points_awarded" | "scanned_at"> & {
  booth_id: string | null
}

export type BoothRow = Pick<Booth, "id" | "name" | "coordinate_x" | "coordinate_y">

/** Label untuk nilai gate_name yang ditulis kode check-in (src/lib/check-in.ts, src/lib/booths.ts). */
const GATE_LABELS: Record<string, string> = {
  main_gate: "Gate Utama",
  manual_desk: "Meja Manual",
  self_service_geofence: "Self Check-in",
}

/** Check-in "booth_skipped_gate" ditulis dengan gate_name "booth:<slug>" — digabung jadi satu garis. */
export const SKIPPED_GATE_LABEL = "Skipped Gate"

export function gateLabel(gateName: string): string {
  if (gateName.startsWith("booth:")) return SKIPPED_GATE_LABEL
  if (GATE_LABELS[gateName]) return GATE_LABELS[gateName]
  // gate_a → Gate A, gate-b → Gate B
  return gateName
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export type GateThroughput = {
  labels: string[]
  /** total check-in semua gate per bucket */
  total: number[]
  /** satu garis per gate; "Skipped Gate" selalu di urutan terakhir */
  perGate: { name: string; values: number[] }[]
  stats: {
    /** check-in di rentang waktu (termasuk skipped gate) */
    checkIns: number
    skippedGate: number
    uniqueVisitors: number
    pointsGiven: number
    /** label bucket tersibuk, mis. "10.00"; null kalau belum ada data */
    peakLabel: string | null
  }
}

export function buildGateThroughput(
  checkIns: GateCheckInRow[],
  scans: BoothScanRow[],
  rangeKey: RangeKey,
  now: Date = new Date(),
): GateThroughput {
  const range = getRange(rangeKey)
  const rows = checkIns.map((r) => ({ ...r, at: r.checked_in_at, gate: gateLabel(r.gate_name) }))

  const { labels, values: total } = bucketize(rows, range, now)
  const { series } = bucketizeBy(rows, (r) => r.gate, range, now)
  const perGate = [
    ...series.filter((s) => s.name !== SKIPPED_GATE_LABEL),
    ...series.filter((s) => s.name === SKIPPED_GATE_LABEL),
  ]

  const start = windowStart(range, now).getTime()
  const inWindow = rows.filter((r) => {
    const t = new Date(r.at).getTime()
    return t >= start && t <= now.getTime()
  })
  const scansInWindow = withinRange(
    scans.map((s) => ({ ...s, at: s.scanned_at })),
    range,
    now,
  )

  const peak = Math.max(0, ...total)
  return {
    labels,
    total,
    perGate,
    stats: {
      checkIns: inWindow.length,
      skippedGate: inWindow.filter((r) => r.check_in_type === "booth_skipped_gate").length,
      uniqueVisitors: new Set(inWindow.map((r) => r.user_id)).size,
      // points_awarded sudah termasuk bonus (src/lib/booths.ts)
      pointsGiven: scansInWindow.reduce((sum, s) => sum + (s.points_awarded ?? 0), 0),
      peakLabel: peak > 0 ? labels[total.indexOf(peak)] : null,
    },
  }
}

export type HeatPoint = {
  id: string
  name: string
  lng: number
  lat: number
  /** jumlah scan di booth ini dalam rentang waktu */
  value: number
}

/**
 * Konvensi src/lib/booths.ts: x = lng (~107.61), y = lat (~-6.89).
 * Latitude selalu |v| <= 90, jadi kalau y > 90 berarti kolomnya ketukar.
 */
function boothLngLat(b: BoothRow): [number, number] | null {
  if (b.coordinate_x == null || b.coordinate_y == null) return null
  return Math.abs(b.coordinate_y) > 90 ? [b.coordinate_y, b.coordinate_x] : [b.coordinate_x, b.coordinate_y]
}

export function buildBoothHeat(
  scans: BoothScanRow[],
  booths: BoothRow[],
  rangeKey: RangeKey,
  now: Date = new Date(),
): HeatPoint[] {
  const range = getRange(rangeKey)
  const counts = new Map<string, number>()
  for (const s of withinRange(scans.map((s) => ({ ...s, at: s.scanned_at })), range, now)) {
    if (!s.booth_id) continue // poin manual admin, tidak ada lokasi
    counts.set(s.booth_id, (counts.get(s.booth_id) ?? 0) + 1)
  }
  return booths.flatMap((b) => {
    const pos = boothLngLat(b)
    if (!pos) return []
    return [{ id: b.id, name: b.name, lng: pos[0], lat: pos[1], value: counts.get(b.id) ?? 0 }]
  })
}

export const formatNumberId = (n: number) => n.toLocaleString("id-ID")
