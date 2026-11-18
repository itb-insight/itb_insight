import type { BoothRow, BoothScanRow, GateCheckInRow } from "@/features/admin/data/dday"

/**
 * Data dummy D-Day (28 Nov 2026, 08.00–20.00 WIB) untuk preview widget sebelum
 * halaman /admin/d-day mengambil data asli. Deterministik (seeded) supaya
 * screenshot / review konsisten. Hapus bersama /admin/widget-preview.
 *
 * Bentuk barisnya mengikuti kode yang menulis data:
 *  - gate_name "gate_a".."gate_d" (dari body /api/check-in/scan), dan
 *    "booth:<slug>" untuk check_in_type "booth_skipped_gate" (src/lib/booths.ts)
 *  - points_awarded sudah termasuk bonus; booth_id null = poin manual admin
 */

export const MOCK_NOW = new Date("2026-11-28T19:30:00+07:00")

const GATES = ["gate_a", "gate_b", "gate_c", "gate_d"]

export const MOCK_BOOTHS: BoothRow[] = [
  { id: "b-drone", name: "Booth: Drone Showcase", coordinate_x: 107.61085, coordinate_y: -6.89155 },
  { id: "b-robot", name: "Booth: Robot SAR", coordinate_x: 107.61125, coordinate_y: -6.89178 },
  { id: "b-ai", name: "Booth 1A: AI Lab", coordinate_x: 107.61042, coordinate_y: -6.89118 },
  { id: "b-energy", name: "Booth 2B: Energy", coordinate_x: 107.60985, coordinate_y: -6.89205 },
  { id: "b-vr", name: "Booth: VR Experience", coordinate_x: 107.61162, coordinate_y: -6.89102 },
  { id: "b-fluid", name: "Booth: Non-Newtonian Pool", coordinate_x: 107.60955, coordinate_y: -6.89138 },
  { id: "b-sponsor", name: "Booth Sponsor Utama", coordinate_x: 107.6106, coordinate_y: -6.89238 },
]

/** Popularitas relatif tiap booth (bobot sampling) */
const BOOTH_WEIGHT = [9, 6, 4, 2, 5, 1, 3]

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Kurva keramaian per jam: ramai pagi & sore, sepi saat ishoma */
const HOURLY = [340, 85, 160, 100, 205, 55, 285, 75, 285, 260, 460, 210]

export function makeMockDDay() {
  const rand = seeded(2026)
  const start = new Date("2026-11-28T08:00:00+07:00").getTime()

  const checkIns: GateCheckInRow[] = []
  HOURLY.forEach((count, h) => {
    for (let i = 0; i < count; i++) {
      const at = new Date(start + (h * 60 + rand() * 60) * 60_000).toISOString()
      const userId = `u-${Math.floor(rand() * 4200)}`
      if (rand() < 0.04) {
        checkIns.push({ user_id: userId, gate_name: "booth:drone-showcase", check_in_type: "booth_skipped_gate", checked_in_at: at })
        continue
      }
      checkIns.push({
        user_id: userId,
        gate_name: GATES[Math.floor(rand() ** 1.6 * GATES.length)],
        check_in_type: rand() < 0.7 ? "staff_scan" : "self_scan",
        checked_in_at: at,
      })
    }
  })

  const weightSum = BOOTH_WEIGHT.reduce((a, b) => a + b, 0)
  const scans: BoothScanRow[] = []
  for (let i = 0; i < 2600; i++) {
    let r = rand() * weightSum
    let bi = 0
    while (r > BOOTH_WEIGHT[bi]) r -= BOOTH_WEIGHT[bi++]
    // booth populer lebih ramai sore hari
    const minute = Math.min(719, rand() ** (bi < 2 ? 0.6 : 1.3) * 720)
    scans.push({
      user_id: `u-${Math.floor(rand() * 4200)}`,
      booth_id: rand() < 0.02 ? null : MOCK_BOOTHS[bi].id,
      scanned_at: new Date(start + minute * 60_000).toISOString(),
      points_awarded: 50 + (rand() < 0.2 ? Math.round(rand() * 20) : 0),
    })
  }

  return { checkIns, scans, booths: MOCK_BOOTHS }
}
