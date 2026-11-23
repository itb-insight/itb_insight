"use client"

import { useState } from "react"

import RangeTabs from "@/features/admin/components/RangeTabs/RangeTabs"
import BarChartHifi, { type BarItemHifi } from "./BarChartHifi"
import styles from "./KeramaianBoothHifi.module.css"

export type ModeBooth = "scan" | "point"

const MODE = [
  { key: "scan" as const, label: "Scan" },
  { key: "point" as const, label: "Point" },
]

interface KeramaianBoothHifiProps {
  title?: string
  subtitle?: string
  /** Dua daftar terpisah: yang ditampilkan mengikuti tab yang dipilih. */
  scan: BarItemHifi[]
  point: BarItemHifi[]
  /**
   * Berapa booth yang ditampilkan sebelum tombol ditekan. Rancangannya
   * menggambar 11 baris, sementara acaranya punya 24 booth.
   */
  batas?: number
}

/**
 * Keramaian Booth — Figma node 1875:5148.
 *
 * Barisnya memakai BarChartHifi varian inline (label 120 | bar | angka, jarak
 * 16) — ukurannya sudah sama persis dengan dump, jadi tidak digambar ulang.
 * Yang ditambahkan di sini cuma tab Scan/Point dan tombol di kakinya.
 */
export default function KeramaianBoothHifi({
  title = "Keramaian Booth",
  subtitle = "Aktivitas per booth",
  scan,
  point,
  batas = 11,
}: KeramaianBoothHifiProps) {
  const [mode, setMode] = useState<ModeBooth>("scan")
  const [semua, setSemua] = useState(false)

  const semuaBaris = mode === "scan" ? scan : point
  /*
    Tombolnya membuka daftar penuh, bukan pindah halaman.

    Rancangannya cuma menulis "Lihat semua booth" tanpa menunjuk ke mana, dan
    halaman daftar booth belum ada. Membuka di tempat membuat tombolnya benar-
    benar bekerja sekarang, tanpa mengarang route yang belum disepakati.
  */
  const baris = semua ? semuaBaris : semuaBaris.slice(0, batas)
  const adaSisa = semuaBaris.length > batas

  return (
    <BarChartHifi
      title={title}
      subtitle={subtitle}
      items={baris}
      action={
        <RangeTabs value={mode} onChange={setMode} options={MODE} label="Tampilkan scan atau point" />
      }
      footer={
        adaSisa ? (
          <div>
            <button
              type="button"
              className={styles.tombol}
              aria-expanded={semua}
              onClick={() => setSemua((v) => !v)}
            >
              {semua ? `Tampilkan ${batas} teratas` : "Lihat semua booth"}
            </button>
          </div>
        ) : null
      }
    />
  )
}
