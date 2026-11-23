"use client"

import { useMemo, useState } from "react"

import HeatmapWidget from "@/features/admin/components/HeatmapWidget/HeatmapWidget"
import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"
import { SKIPPED_GATE_LABEL, buildGateThroughput, buildBoothHeat } from "@/features/admin/data/dday"
import { MOCK_NOW, makeMockDDay } from "@/features/admin/data/ddayMock"
import type { RangeKey } from "@/features/admin/data/timeRange"

/** Line chart "Keramaian" — widget Mulky, tanpa kerangka halamannya. */
export function Keramaian() {
  const mock = useMemo(() => makeMockDDay(), [])
  const [range, setRange] = useState<RangeKey>("12h")
  const data = buildGateThroughput(mock.checkIns, mock.scans, range, MOCK_NOW)

  return (
    <LineChartWidget
      title="Keramaian"
      description="Update check-in per 15 menit"
      labels={data.labels}
      series={data.perGate.map((s) =>
        s.name === SKIPPED_GATE_LABEL ? { ...s, color: "#dee8fb" } : s,
      )}
      range={range}
      onRangeChange={setRange}
      unit="check-in"
    />
  )
}

/** Heat Map Keramaian — widget Mulky. */
export function HeatMap() {
  const mock = useMemo(() => makeMockDDay(), [])
  const [range, setRange] = useState<RangeKey>("30m")
  const points = buildBoothHeat(mock.scans, mock.booths, range, MOCK_NOW)

  return (
    <HeatmapWidget
      title="Heat Map Keramaian"
      description="Sebaran scan booth di area acara"
      points={points}
      range={range}
      onRangeChange={setRange}
    />
  )
}
