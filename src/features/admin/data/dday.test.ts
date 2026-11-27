import { describe, expect, it } from "vitest"

import {
  BOOTH_TARGET,
  EVENT_CLOSE_HOUR,
  SKIPPED_GATE_LABEL,
  buildBoothBars,
  buildBoothHeat,
  buildBoothHeatLive,
  buildFunnel,
  buildGateSeries,
  buildGateThroughput,
  buildStaffGroups,
  formatMinutes,
  gateLabel,
  isAfterClose,
  type BoothScanRow,
  type GateCheckInRow,
} from "./dday"

const NOW = new Date("2026-11-28T12:00:00+07:00")
const at = (hhmm: string) => new Date(`2026-11-28T${hhmm}:00+07:00`).toISOString()

const checkIns: GateCheckInRow[] = [
  { user_id: "u1", gate_name: "gate_a", check_in_type: "staff_scan", checked_in_at: at("09:10") },
  { user_id: "u2", gate_name: "gate_a", check_in_type: "self_scan", checked_in_at: at("09:40") },
  { user_id: "u3", gate_name: "gate_b", check_in_type: "staff_scan", checked_in_at: at("10:05") },
  { user_id: "u1", gate_name: "booth:drone", check_in_type: "booth_skipped_gate", checked_in_at: at("11:30") },
  // di luar jendela 12 jam
  { user_id: "u9", gate_name: "gate_a", check_in_type: "staff_scan", checked_in_at: "2026-11-27T20:00:00+07:00" },
]

const scans: BoothScanRow[] = [
  { user_id: "u1", booth_id: "b1", points_awarded: 60, scanned_at: at("11:50") },
  { user_id: "u2", booth_id: "b1", points_awarded: 50, scanned_at: at("11:40") },
  { user_id: "u3", booth_id: "b2", points_awarded: 50, scanned_at: at("10:00") },
  { user_id: "u4", booth_id: null, points_awarded: 100, scanned_at: at("11:55") },
]

describe("gateLabel", () => {
  it("memberi label untuk gate_name yang ditulis kode check-in", () => {
    expect(gateLabel("main_gate")).toBe("Gate Utama")
    expect(gateLabel("manual_desk")).toBe("Meja Manual")
    expect(gateLabel("gate_a")).toBe("Gate A")
    expect(gateLabel("booth:drone-showcase")).toBe(SKIPPED_GATE_LABEL)
  })
})

describe("buildGateThroughput", () => {
  const g = buildGateThroughput(checkIns, scans, "12h", NOW)

  it("membuat 12 bucket per jam dan mengabaikan data di luar jendela", () => {
    expect(g.labels).toHaveLength(12)
    expect(g.total.reduce((a, b) => a + b, 0)).toBe(4)
    expect(g.labels[g.total.indexOf(2)]).toBe("09.00")
  })

  it("memisahkan garis per gate dengan skipped gate di urutan terakhir", () => {
    expect(g.perGate.map((s) => s.name)).toEqual(["Gate A", "Gate B", SKIPPED_GATE_LABEL])
  })

  it("menghitung ringkasan", () => {
    expect(g.stats.checkIns).toBe(4)
    expect(g.stats.skippedGate).toBe(1)
    expect(g.stats.uniqueVisitors).toBe(3)
    // points_awarded sudah termasuk bonus; poin manual admin (booth_id null) tetap dihitung
    expect(g.stats.pointsGiven).toBe(260)
    expect(g.stats.peakLabel).toBe("09.00")
  })
})

describe("buildBoothHeat", () => {
  const booths = [
    { id: "b1", name: "Drone", coordinate_x: 107.611, coordinate_y: -6.8915 },
    { id: "b2", name: "Robot", coordinate_x: -6.892, coordinate_y: 107.6112 }, // kolom ketukar
    { id: "b3", name: "Tanpa lokasi", coordinate_x: null, coordinate_y: null },
  ]

  it("menghitung scan per booth dalam rentang dan melewati poin manual tanpa booth", () => {
    const heat = buildBoothHeat(scans, booths, "30m", NOW)
    expect(heat.map((p) => [p.id, p.value])).toEqual([
      ["b1", 2],
      ["b2", 0],
    ])
  })

  it("membetulkan koordinat yang tertukar", () => {
    const b2 = buildBoothHeat(scans, booths, "12h", NOW).find((p) => p.id === "b2")
    expect(b2).toMatchObject({ lng: 107.6112, lat: -6.892, value: 1 })
  })
})

describe("D-day live builders", () => {
  const booth = (id: string, name: string, scans: number, points: number, pos: [number, number] | null = null) => ({
    id,
    name,
    lng: pos?.[0] ?? null,
    lat: pos?.[1] ?? null,
    scans,
    points,
    windows: { "30m": 1, "1h": 2, "2h": 3, "5h": 4, "12h": scans },
  })

  it("buildGateSeries menjumlahkan slot 5 menit (count) ke bucket rentang", () => {
    const slots = [
      { slot: at("09:00"), gate: "main_gate", count: 3 },
      { slot: at("09:05"), gate: "main_gate", count: 2 },
      { slot: at("09:10"), gate: "booth:drone", count: 1 },
    ]
    const g = buildGateSeries(slots, "12h", NOW)
    expect(g.perGate.map((s) => s.name)).toEqual(["Gate Utama", SKIPPED_GATE_LABEL])
    expect(g.perGate[0].values[g.labels.indexOf("09.00")]).toBe(5)
    expect(g.perGate[1].values.reduce((a, b) => a + b, 0)).toBe(1)
  })

  it("buildBoothBars mengurutkan dari yang teramai, bar relatif ke puncak", () => {
    const bars = buildBoothBars([booth("a", "A", 5, 10), booth("b", "B", 10, 5), booth("c", "C", 0, 0)])
    expect(bars.scan.map((b) => [b.label, b.percent])).toEqual([["B", 100], ["A", 50], ["C", 0]])
    expect(bars.point[0]).toMatchObject({ label: "A", value: "10", percent: 100 })
    expect(buildBoothBars([booth("c", "C", 0, 0)]).scan[0].percent).toBe(0)
  })

  it("buildBoothHeatLive memakai jendela yang dipilih dan melewati booth tanpa posisi", () => {
    const heat = buildBoothHeatLive([booth("a", "A", 9, 0, [107.61, -6.89]), booth("b", "B", 3, 0)], "1h")
    expect(heat).toEqual([{ id: "a", name: "A", lng: 107.61, lat: -6.89, value: 2 }])
  })

  it("buildFunnel menghitung persentase dari pengunjung hari ini", () => {
    const items = buildFunnel({ visitors: 200, scanned_1: 150, scanned_5: 50, reached_target: 10, claimed: 0 })
    expect(items.map((i) => i.share)).toEqual(["100%", "75%", "25%", "5%", "0%"])
    expect(items[3].label).toBe(`Capai target ${BOOTH_TARGET} booth`)
    expect(buildFunnel({ visitors: 0, scanned_1: 0, scanned_5: 0, reached_target: 0, claimed: 0 })[0].percent).toBe(0)
  })

  it("buildStaffGroups mengelompokkan per gate / booth, gate dulu", () => {
    const groups = buildStaffGroups(
      [
        { kind: "booth", location: "b1", user_id: "s2", name: "Bo", role_a: "staff", role_b: "booth", scans: 4, points: 40, last_at: at("10:30") },
        { kind: "gate", location: "main_gate", user_id: "s1", name: "Sam", role_a: "staff", role_b: "human_resource", scans: 3, points: 0, last_at: at("09:15") },
        { kind: "booth", location: "b1", user_id: "s3", name: "Ad", role_a: "admin", role_b: null, scans: 6, points: 60, last_at: null },
      ],
      [{ id: "b1", name: "Drone Showcase" }],
      (iso) => iso.slice(11, 16),
    )
    expect(groups.map((g) => [g.label, g.totalScan, g.totalPoints])).toEqual([
      ["Gate Utama", 3, 0],
      ["Drone Showcase", 10, 100],
    ])
    expect(groups[0].staff[0]).toMatchObject({ name: "Sam", role: "Gate staff · Human Resource" })
    expect(groups[1].staff.map((s) => [s.name, s.role, s.lastScan])).toEqual([
      ["Ad", "Admin", null],
      ["Bo", "Booth staff", "03:30"],
    ])
  })

  it("isAfterClose mulai pukul 17.00 WIB", () => {
    expect(EVENT_CLOSE_HOUR).toBe(17)
    expect(isAfterClose(new Date("2026-11-28T16:59:00+07:00"))).toBe(false)
    expect(isAfterClose(new Date("2026-11-28T17:00:00+07:00"))).toBe(true)
    expect(isAfterClose(new Date("2026-11-28T23:30:00+07:00"))).toBe(true)
  })

  it("formatMinutes", () => {
    expect(formatMinutes(840)).toBe("14 menit")
    expect(formatMinutes(3600)).toBe("1 jam")
    expect(formatMinutes(4000)).toBe("1 jam 7 menit")
  })
})
