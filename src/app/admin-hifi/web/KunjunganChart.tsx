"use client"

import { useState } from "react"

import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"

type RentangKunjungan = "14h" | "30h" | "total"

const RENTANG = [
  { key: "14h" as const, label: "14 hari" },
  { key: "30h" as const, label: "30 hari" },
  { key: "total" as const, label: "Total" },
]

/* Label hari, mundur dari hari ini. */
const labelHari = (n: number) =>
  Array.from({ length: n }, (_, i) => `H-${n - 1 - i}`)

/* Angka contoh; bentuknya sengaja bergelombang supaya dua garisnya terbedakan. */
const deret = (n: number, dasar: number, amplitudo: number) =>
  Array.from({ length: n }, (_, i) =>
    Math.round(dasar + amplitudo * (0.5 + 0.5 * Math.sin(i * 1.1)) + (i % 3) * amplitudo * 0.12),
  )

const DATA: Record<RentangKunjungan, { titik: number }> = {
  "14h": { titik: 14 },
  "30h": { titik: 30 },
  total: { titik: 45 },
}

/**
 * Kunjungan — Figma node 1875:4385.
 *
 * Tidak ada komponen baru: LineChartWidget sudah menggambar dua garis beserta
 * legendanya. Yang dipakai di sini cuma prop `rangeOptions` yang baru, supaya
 * tabnya 14 hari / 30 hari / Total, bukan rentang waktu D-Day.
 *
 * Catatan dump: di Figma ada EMPAT lapis garis (kuning, hijau, ungu, biru) tapi
 * legendanya cuma menyebut dua — Kunjungan dan Visitor. Dua lapis sisanya
 * kelihatannya tertinggal dari komponen yang disalin, jadi yang digambar
 * mengikuti legendanya.
 *
 * Sumbu-x di dump tertulis jam (08.00–19.00), padahal tabnya "14 hari". Itu
 * juga bekas salinan grafik D-Day; di sini dipakai label hari.
 */
export default function KunjunganChart() {
  const [range, setRange] = useState<RentangKunjungan>("14h")
  const n = DATA[range].titik

  return (
    <LineChartWidget
      title="Kunjungan"
      description="Kunjungan dan visitor per hari"
      labels={labelHari(n)}
      series={[
        { name: "Kunjungan", values: deret(n, 120, 330), color: "#fad500" },
        { name: "Visitor", values: deret(n, 60, 210), color: "#7fa9f6" },
      ]}
      range={range}
      onRangeChange={setRange}
      rangeOptions={RENTANG}
      unit="kunjungan"
    />
  )
}
