"use client"

import { useMemo, useState } from "react"

import HeatmapWidget from "@/features/admin/components/HeatmapWidget/HeatmapWidget"
import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"
import {
  SKIPPED_GATE_LABEL,
  buildBoothHeat,
  buildGateThroughput,
} from "@/features/admin/data/dday"
import { MOCK_NOW, makeMockDDay } from "@/features/admin/data/ddayMock"
import type { RangeKey } from "@/features/admin/data/timeRange"

/**
 * Widget lane D-Day (Mulky) tanpa kerangka halamannya.
 *
 * DDayWidgetsPreview miliknya membawa <main> dan judul halaman sendiri — itu
 * benar untuk route-nya sendiri, tapi di sini sudah ada <main> dari
 * AdminShellHifi, dan <main> bersarang itu tidak sah.
 *
 * Builder dan data mock-nya dipakai apa adanya dari berkas dia; yang ditulis
 * ulang di sini cuma state rentang waktunya.
 */
export default function DDayLane() {
  const mock = useMemo(() => makeMockDDay(), [])
  const [gateRange, setGateRange] = useState<RangeKey>("12h")
  const [totalRange, setTotalRange] = useState<RangeKey>("12h")
  const [heatRange, setHeatRange] = useState<RangeKey>("30m")

  const perGate = buildGateThroughput(mock.checkIns, mock.scans, gateRange, MOCK_NOW)
  const total = buildGateThroughput(mock.checkIns, mock.scans, totalRange, MOCK_NOW)
  const heat = buildBoothHeat(mock.scans, mock.booths, heatRange, MOCK_NOW)

  return (
    <>
      <LineChartWidget
        title="Keramaian"
        description="Update check-in per 15 menit"
        labels={perGate.labels}
        series={perGate.perGate.map((s) =>
          // Sama seperti di preview aslinya: skipped gate bukan gate fisik,
          // jadi diberi warna netral supaya tidak dibaca sebagai gate tambahan.
          s.name === SKIPPED_GATE_LABEL ? { ...s, color: "#dee8fb" } : s,
        )}
        range={gateRange}
        onRangeChange={setGateRange}
        unit="check-in"
      />

      <LineChartWidget
        title="Throughput Gate"
        description="Total check-in semua gate"
        labels={total.labels}
        series={[{ name: "Total", values: total.total }]}
        range={totalRange}
        onRangeChange={setTotalRange}
        unit="check-in"
      />

      <HeatmapWidget
        description="Sebaran scan booth di area acara"
        points={heat}
        range={heatRange}
        onRangeChange={setHeatRange}
      />
    </>
  )
}
