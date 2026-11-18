import { describe, expect, it } from "vitest"

import {
  SKIPPED_GATE_LABEL,
  buildBoothHeat,
  buildGateThroughput,
  gateLabel,
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
