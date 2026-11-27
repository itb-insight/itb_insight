"use client"

import { useState } from "react"

import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"
import type { BoothDayDto } from "@/features/admin/data/types"

import { count, dayLabel, hourLabel } from "./format"

/**
 * Jumlah Pengunjung (Figma 1972:24352): distinct visitors per hour at one booth, one tab per
 * event day with scans (newest selected).
 */
export default function BoothVisitorsChart({ days }: { days: BoothDayDto[] }) {
  const [selected, setSelected] = useState(days.at(-1)?.day ?? "")
  const day = days.find((d) => d.day === selected) ?? days.at(-1)

  const busiest = day?.hours.reduce((best, h) => (h.visitors > best.visitors ? h : best), { hour: -1, visitors: 0 })

  return (
    <LineChartWidget<string>
      title="Jumlah Pengunjung"
      description="Pengunjung unik per jam di booth ini, dari scan QR (WIB)"
      labels={day ? day.hours.map((h) => hourLabel(h.hour)) : []}
      series={[{ name: "Pengunjung unik", values: day ? day.hours.map((h) => h.visitors) : [], color: "#acc7ff" }]}
      stats={[
        { label: "Visitor unik", value: day ? count(day.visitors) : "0" },
        { label: "Points diberikan", value: day ? count(day.points) : "0" },
        { label: "Jam tersibuk", value: busiest && busiest.hour >= 0 ? hourLabel(busiest.hour) : "—" },
      ]}
      area
      unit="visitor"
      emptyText="Belum ada scan QR di booth ini"
      {...(days.length > 1
        ? {
            range: day?.day ?? "",
            onRangeChange: setSelected,
            rangeOptions: days.map((d) => ({ key: d.day, label: dayLabel(d.day) })),
          }
        : {})}
    />
  )
}
