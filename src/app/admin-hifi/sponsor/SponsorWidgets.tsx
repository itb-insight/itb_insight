"use client"

import { useMemo, useState } from "react"

import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"
import type { RangeKey } from "@/features/admin/data/timeRange"
import PanelHifi from "@/features/admin-hifi/PanelHifi"
import styles from "./SponsorWidgets.module.css"

/* Dua belas titik, H-11 sampai H-0 — sumbu-x di dump. */
const LABEL_HARI = Array.from({ length: 12 }, (_, i) => `H-${11 - i}`)

const IMPRESSIONS = [6800, 1500, 3100, 1900, 4200, 900, 5500, 1300, 5300, 5000, 9200, 4100]
const KLIK = [340, 90, 155, 100, 205, 50, 285, 70, 280, 255, 460, 210]

/**
 * Engagement — Figma node 1972:23869.
 *
 * DUA grafik di dalam SATU kartu, bersebelahan dengan jarak 18. Karena itu
 * LineChartWidget dipakai dalam mode `bare` (tanpa kartunya sendiri) dan
 * kartunya dipasang sekali di sini lewat PanelHifi.
 *
 * Tiap grafik dinamai oleh legendanya, bukan judul — persis seperti dump.
 */
export function Engagement() {
  return (
    <PanelHifi title="Engagement" subtitle="Impressions & klik per hari">
      <div className={styles.duaGrafik}>
        <LineChartWidget
          bare
          title="Impressions per hari"
          labels={LABEL_HARI}
          series={[{ name: "Impressions per hari", values: IMPRESSIONS, color: "#fffc86" }]}
          area
          unit="impression"
        />
        <LineChartWidget
          bare
          title="Klik per hari"
          labels={LABEL_HARI}
          series={[{ name: "Klik per hari", values: KLIK, color: "#acc7ff" }]}
          area
          unit="klik"
        />
      </div>
    </PanelHifi>
  )
}

/* Jam acara 08.00–19.00, sesuai sumbu-x di dump. */
const LABEL_JAM = Array.from({ length: 12 }, (_, i) => `${String(8 + i).padStart(2, "0")}.00`)
const PENGUNJUNG = [345, 85, 160, 100, 285, 75, 285, 100, 285, 265, 460, 210]

/**
 * Jumlah Pengunjung — Figma node 1972:24352.
 *
 * Tidak ada komponen baru: LineChartWidget sudah punya prop `stats` untuk tiga
 * angka besar di atas grafik, area gradient, dan tab rentang waktu.
 */
export function JumlahPengunjung() {
  const [range, setRange] = useState<RangeKey>("12h")

  const stats = useMemo(
    () => [
      { label: "Visitor Unik", value: "10.000.000" },
      { label: "Points diberikan", value: "10.000.000" },
      { label: "Jam tersibuk", value: "10.00" },
    ],
    [],
  )

  return (
    <LineChartWidget
      title="Jumlah Pengunjung"
      description="Pengunjung unik per 15 menit di booth Anda"
      labels={LABEL_JAM}
      series={[{ name: "Pengunjung unik", values: PENGUNJUNG, color: "#acc7ff" }]}
      stats={stats}
      area
      range={range}
      onRangeChange={setRange}
      unit="visitor"
    />
  )
}
