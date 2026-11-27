"use client"

import { useState } from "react"

import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"
import type { WebDayDto } from "@/features/admin/data/types"

import { dayLabel } from "./format"

type VisitsRange = "14d" | "30d" | "all"

const RANGES = [
  { key: "14d" as const, label: "14 hari" },
  { key: "30d" as const, label: "30 hari" },
  { key: "all" as const, label: "Total" },
]

const DAYS: Record<VisitsRange, number> = { "14d": 14, "30d": 30, all: Number.POSITIVE_INFINITY }

/** Kunjungan (Figma 1875:4385): page views and distinct visitors per Jakarta day. */
export default function WebVisitsChart({ daily }: { daily: WebDayDto[] }) {
  const [range, setRange] = useState<VisitsRange>("14d")
  const shown = Number.isFinite(DAYS[range]) ? daily.slice(-DAYS[range]) : daily

  return (
    <LineChartWidget
      title="Kunjungan"
      description="Page view dan visitor unik per hari (WIB)"
      labels={shown.map((row) => dayLabel(row.day))}
      series={[
        { name: "Kunjungan", values: shown.map((row) => row.pageviews), color: "#fad500" },
        { name: "Visitor", values: shown.map((row) => row.visitors), color: "#7fa9f6" },
      ]}
      range={range}
      onRangeChange={setRange}
      rangeOptions={RANGES}
      unit="kunjungan"
    />
  )
}
