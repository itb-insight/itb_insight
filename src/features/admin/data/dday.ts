import type { StaffScanGroup } from "@/features/dashboard-tables/types"
import type { DDayBoothDto, DDayFunnelDto, DDayGateSlotDto, DDayStaffDto } from "@/features/admin/data/types"
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

// ─── /admin/d-day (live, admin_dday in migration 0028) ───────────────────────

/**
 * Live headcount rule: a visitor counts as in the area for this long after their latest in-area
 * signal (gate check-in, booth scan, presence ping), unless their phone reports leaving after it
 * (POST /api/presence/exit).
 */
export const ASSUME_IN_AREA_HOURS = 5

/** "Capai target" in the Aktivitas visitor funnel. */
export const BOOTH_TARGET = 15

/**
 * Closing time, Jakarta (src/features/events/details.ts: 09.00 – 17.00 WIB). From then on the page
 * warns that the headcount still includes people who left without their phone reporting it.
 */
export const EVENT_CLOSE_HOUR = 17

const jakartaHour = (now: Date) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", hour12: false }).format(now)) % 24

export function isAfterClose(now: Date = new Date()): boolean {
  return jakartaHour(now) >= EVENT_CLOSE_HOUR
}

/** Pre-aggregated 5-minute slots (admin_dday "gates") → one line per gate, like buildGateThroughput. */
export function buildGateSeries(slots: DDayGateSlotDto[], rangeKey: RangeKey, now: Date = new Date()) {
  const range = getRange(rangeKey)
  const rows = slots.map((s) => ({ at: s.slot, count: s.count, gate: gateLabel(s.gate) }))
  const { labels, series } = bucketizeBy(rows, (r) => r.gate, range, now)
  return {
    labels,
    perGate: [
      ...series.filter((s) => s.name !== SKIPPED_GATE_LABEL),
      ...series.filter((s) => s.name === SKIPPED_GATE_LABEL),
    ],
  }
}

/** Booths with a position, valued by their scans in the chosen window. */
export function buildBoothHeatLive(booths: DDayBoothDto[], rangeKey: RangeKey): HeatPoint[] {
  return booths.flatMap((b) =>
    b.lng === null || b.lat === null ? [] : [{ id: b.id, name: b.name, lng: b.lng, lat: b.lat, value: b.windows[rangeKey] }],
  )
}

/** Bars for Keramaian Booth: scans and points today, busiest first, bar length relative to the top. */
export function buildBoothBars(booths: DDayBoothDto[]) {
  const bars = (pick: (b: DDayBoothDto) => number) => {
    const sorted = [...booths].sort((a, b) => pick(b) - pick(a) || a.name.localeCompare(b.name))
    const top = Math.max(0, ...sorted.map(pick))
    return sorted.map((b) => ({
      label: b.name,
      value: formatNumberId(pick(b)),
      percent: top > 0 ? Math.round((pick(b) / top) * 100) : 0,
    }))
  }
  return { scan: bars((b) => b.scans), point: bars((b) => b.points) }
}

/** The Aktivitas visitor funnel; share and bar length are relative to today's visitors. */
export function buildFunnel(funnel: DDayFunnelDto) {
  const base = funnel.visitors
  const stage = (label: string, value: number) => {
    const share = base > 0 ? Math.round((value / base) * 100) : 0
    return { label, value: formatNumberId(value), share: `${share}%`, percent: Math.min(100, share) }
  }
  return [
    stage("Hadir (check-in / scan)", funnel.visitors),
    stage("Scan minimal 1 booth", funnel.scanned_1),
    stage("Scan minimal 5 booth", funnel.scanned_5),
    stage(`Capai target ${BOOTH_TARGET} booth`, funnel.reached_target),
    stage("Klaim hadiah", funnel.claimed),
  ]
}

/** 840 → "14 menit"; 4000 → "1 jam 7 menit". */
export function formatMinutes(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} menit`
  const rest = minutes % 60
  return rest === 0 ? `${Math.floor(minutes / 60)} jam` : `${Math.floor(minutes / 60)} jam ${rest} menit`
}

const ROLE_B_LABELS: Record<string, string> = {
  human_resource: "Human Resource",
  booth: "Booth",
  field: "Field",
  event: "Event",
  gensec: "Gensec",
  creative: "Creative",
  fundraising: "Fundraising",
  competition: "Competition",
  marketing: "Marketing",
  webdev: "Webdev",
  media: "Media",
  sponsorship: "Sponsorship",
  partner: "Partner",
}

function staffRole(row: DDayStaffDto): string {
  if (row.role_a === "admin") return "Admin"
  const duty = row.kind === "gate" ? "Gate staff" : "Booth staff"
  const division = row.role_b ? ROLE_B_LABELS[row.role_b] ?? row.role_b : null
  return division && division !== "Booth" ? `${duty} · ${division}` : duty
}

/** Staff scan table: one group per gate / booth, its staff busiest first. */
export function buildStaffGroups(
  staff: DDayStaffDto[],
  booths: Pick<DDayBoothDto, "id" | "name">[],
  formatTime: (iso: string) => string,
): StaffScanGroup[] {
  const boothNames = new Map(booths.map((b) => [b.id, b.name]))
  const groups = new Map<string, StaffScanGroup>()

  for (const row of staff) {
    const id = `${row.kind}:${row.location}`
    let group = groups.get(id)
    if (!group) {
      const label = row.kind === "gate" ? gateLabel(row.location) : boothNames.get(row.location) ?? "Booth"
      group = { id, label, kind: row.kind, totalScan: 0, totalPoints: 0, staff: [] }
      groups.set(id, group)
    }
    group.totalScan += row.scans
    group.totalPoints += row.points
    group.staff.push({
      id: `${id}:${row.user_id}`,
      name: row.name,
      role: staffRole(row),
      totalScan: row.scans,
      totalPoints: row.points,
      lastScan: row.last_at ? formatTime(row.last_at) : null,
    })
  }

  return [...groups.values()]
    .map((group) => ({ ...group, staff: group.staff.sort((a, b) => b.totalScan - a.totalScan) }))
    .sort((a, b) => (a.kind === b.kind ? b.totalScan - a.totalScan : a.kind === "gate" ? -1 : 1))
}
