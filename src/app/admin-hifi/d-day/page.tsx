import { notFound } from "next/navigation"

import AdminShellHifi, { AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import WidgetRowHifi from "@/features/admin-hifi/WidgetRowHifi"
import KeramaianBoothHifi from "@/features/admin-hifi/KeramaianBoothHifi"
import AktivitasVisitorHifi from "@/features/admin-hifi/AktivitasVisitorHifi"
import StaffScanTable from "@/features/dashboard-tables/StaffScanTable"
import { mockStaffScanGroups } from "@/features/dashboard-tables/mock"

import { HeatMap, Keramaian } from "./DDayWidgets"

export const metadata = {
  title: "D-Day | ITB Insight Admin",
  robots: { index: false, follow: false },
}

const RANGKUMAN = [
  { title: "Check-ins", value: "4.912", caption: "termasuk 146 skipped gate" },
  { title: "Booth scans", value: "18.340", caption: "scan" },
  { title: "Points redeemed", value: "917.000", caption: "per 24 booth" },
  { title: "Rata-rata booth/visitor", value: "3,8", caption: "dari target 15 booth" },
]

/* Sebelas booth, panjang bar dari dump (5/4/4/3/3/2/2/1/1/1/1 dari 5 segmen). */
const BOOTH_SCAN = [
  { label: "Drone Showcase", value: "1.000", percent: 100 },
  { label: "Booth 1A", value: "1.000", percent: 80 },
  { label: "Booth 1B", value: "1.000", percent: 80 },
  { label: "Booth 2A", value: "1.000", percent: 60 },
  { label: "Booth 2B", value: "1.000", percent: 60 },
  { label: "Booth 3A", value: "1.000", percent: 40 },
  { label: "Booth 3B", value: "1.000", percent: 40 },
  { label: "Booth 4A", value: "1.000", percent: 20 },
  { label: "Booth 4B", value: "1.000", percent: 20 },
  { label: "Booth 5A", value: "1.000", percent: 20 },
  { label: "Booth 5B", value: "1.000", percent: 20 },
]

/* Acaranya punya 24 booth (lihat kartu "Points redeemed"), rancangannya cuma
   menggambar 11 — sisanya muncul lewat tombol "Lihat semua booth". */
const BOOTH_SCAN_PENUH = [
  ...BOOTH_SCAN,
  ...["6A", "6B", "7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B", "11A", "11B", "12A"].map(
    (kode, i) => ({ label: `Booth ${kode}`, value: "1.000", percent: Math.max(8, 18 - i) }),
  ),
]

/* Tab Point belum ada angkanya di rancangan; dipakai contoh lain supaya
   pergantian tab-nya kelihatan bekerja. */
const BOOTH_POINT = BOOTH_SCAN_PENUH.map((b, i) => ({
  ...b,
  value: `${Math.max(1, 24 - i) * 5}.000`,
  percent: Math.max(8, 100 - i * 4),
}))

const AKTIVITAS = [
  { label: "Check-in", value: "1.000", share: "100%", percent: 100 },
  { label: "Scan minimal 1 booth", value: "1.000", share: "100%", percent: 80 },
  { label: "Scan minimal 5 booth", value: "1.000", share: "100%", percent: 60 },
  { label: "Capai target 15 booth", value: "1.000", share: "100%", percent: 40 },
  { label: "Klaim hadiah", value: "1.000", share: "100%", percent: 20 },
]

const MEDIAN = [
  { label: "Jeda check-in ke booth pertama", value: "median 14 menit" },
  { label: "Jeda antar scan", value: "median 9 menit" },
]

export default function AdminDDayPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <AdminShellHifi
      title="D-Day"
      subtitle="Kehadiran acara, booth, dan point"
      activeHref="/admin-hifi/d-day"
      meta={
        <>
          <AdminPill dot>Diperbarui 12 detik lalu</AdminPill>
          <AdminPill>Event + Competition + Admin</AdminPill>
          <AdminPill>DAY 1, 28 November 2026</AdminPill>
        </>
      }
    >
      <SummaryCardsHifi items={RANGKUMAN} />

      <Keramaian />

      <WidgetRowHifi columns="683fr 675fr">
        <KeramaianBoothHifi scan={BOOTH_SCAN_PENUH} point={BOOTH_POINT} />
        <AktivitasVisitorHifi items={AKTIVITAS} median={MEDIAN} />
      </WidgetRowHifi>

      <StaffScanTable
        groups={mockStaffScanGroups}
        title="Scan"
        subtitle="Tabel total scan dan points yang diberikan staff"
      />

      <HeatMap />
    </AdminShellHifi>
  )
}
