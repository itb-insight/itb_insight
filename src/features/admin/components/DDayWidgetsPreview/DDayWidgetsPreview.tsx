"use client"

import { useMemo, useState } from "react"

import HeatmapWidget from "@/features/admin/components/HeatmapWidget/HeatmapWidget"
import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"
import {
  SKIPPED_GATE_LABEL,
  buildBoothHeat,
  buildGateThroughput,
  formatNumberId,
} from "@/features/admin/data/dday"
import { MOCK_NOW, makeMockDDay } from "@/features/admin/data/ddayMock"
import type { RangeKey } from "@/features/admin/data/timeRange"
import styles from "./DDayWidgetsPreview.module.css"

/**
 * Contoh pemakaian widget dengan data dummy. Di halaman /admin/d-day yang asli:
 * ganti makeMockDDay() dengan hasil query gate_check_ins / booth_scan_events / booths,
 * dan MOCK_NOW dengan new Date() (atau hapus argumen `now`).
 */
export default function DDayWidgetsPreview() {
  const mock = useMemo(() => makeMockDDay(), [])
  const [gateRange, setGateRange] = useState<RangeKey>("12h")
  const [totalRange, setTotalRange] = useState<RangeKey>("12h")
  const [heatRange, setHeatRange] = useState<RangeKey>("30m")

  const perGate = buildGateThroughput(mock.checkIns, mock.scans, gateRange, MOCK_NOW)
  const total = buildGateThroughput(mock.checkIns, mock.scans, totalRange, MOCK_NOW)
  const heat = buildBoothHeat(mock.scans, mock.booths, heatRange, MOCK_NOW)

  return (
    <main className={styles.page}>
      <header>
        <h1 className={styles.title}>Preview widget D-Day</h1>
        <p className={styles.subtitle}>Line Chart + Heatmap · data dummy 28 November 2026</p>
      </header>

      {/* Figma: Page D-Day → "Line chart 2" (full width) */}
      <LineChartWidget
        title="Keramaian"
        description="Update check-in per 15 menit"
        labels={perGate.labels}
        series={perGate.perGate.map((s) =>
          // Skipped gate bukan gate fisik: warna netral supaya tidak dibaca sebagai Gate E
          s.name === SKIPPED_GATE_LABEL ? { ...s, color: "#dee8fb" } : s,
        )}
        range={gateRange}
        onRangeChange={setGateRange}
        unit="check-in"
      />

      {/* Figma: Widgets → "Line chart 1" (satu garis + angka ringkasan) */}
      <LineChartWidget
        title="Throughput Gate"
        description="Total check-in semua gate"
        labels={total.labels}
        series={[{ name: "Check-in", values: total.total }]}
        stats={[
          { label: "Visitor unik", value: formatNumberId(total.stats.uniqueVisitors) },
          { label: "Points diberikan", value: formatNumberId(total.stats.pointsGiven) },
          { label: "Jam tersibuk", value: total.stats.peakLabel ?? "–" },
        ]}
        range={totalRange}
        onRangeChange={setTotalRange}
        unit="check-in"
      />

      {/* Figma: Page D-Day → "Heat Map" */}
      <HeatmapWidget
        description="Sebaran scan booth di area acara"
        points={heat}
        range={heatRange}
        onRangeChange={setHeatRange}
      />
    </main>
  )
}
