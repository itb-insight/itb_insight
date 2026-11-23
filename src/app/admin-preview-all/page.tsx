import { notFound } from "next/navigation"

import AdminShellHifi, { AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import BarChartHifi from "@/features/admin-hifi/BarChartHifi"
import ErrorMonitorHifi from "@/features/admin-hifi/ErrorMonitorHifi"
import FeedbackHifi from "@/features/admin-hifi/FeedbackHifi"
import RingChartHifi from "@/features/admin-hifi/RingChartHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import WidgetRowHifi from "@/features/admin-hifi/WidgetRowHifi"
import StaffScanTable from "@/features/dashboard-tables/StaffScanTable"
import TeamRegistrationTable from "@/features/dashboard-tables/TeamRegistrationTable"
import {
  mockCompetitionOptions,
  mockStaffScanGroups,
  mockTeamRegistrations,
} from "@/features/dashboard-tables/mock"

import DDayLane from "./DDayLane"
import styles from "./page.module.css"

export const metadata = {
  title: "Preview semua widget | ITB Insight Admin",
  description: "Semua widget admin dari ketiga lane, dalam satu halaman.",
  robots: { index: false, follow: false },
}

/*
  Halaman pembanding, bukan rancangan.

  Tiga lane mengerjakan widget admin secara terpisah dan masing-masing membuat
  pembungkus kartunya sendiri:

    PanelHifi    src/features/admin-hifi/                      (lane Web)
    GlassPanel   src/shared/components/GlassTable/             (lane Tabel)
    WidgetCard   src/features/admin/components/WidgetCard/     (lane D-Day)

  Dua lane terakhir bercabang dari dev sebelum PanelHifi ada, jadi mereka tidak
  punya pilihan. Halaman ini menumpuk ketiganya dalam satu kolom supaya selisih
  radius, tebal garis, padding, dan warnanya kelihatan langsung — sesuatu yang
  mustahil dinilai selama tiap lane cuma dilihat di route-nya sendiri.

  Hapus begitu ketiganya sudah disatukan.
*/

const FEEDBACK_CONTOH = [
  { rating: 5, comment: "Gacorrrr", time: "14.10" },
  { rating: 4, comment: "Keren banget", time: "09.54" },
  { rating: 3, comment: "Antrian masuknya lama", time: "13.29" },
  { rating: 5, comment: "WOWWWW KEREN BANGET", time: "17.00" },
  { rating: 2, comment: "Susah nyari staffnya pas makan siang", time: "11.47" },
  { rating: 3, comment: "Ada dispenser ga ya", time: "14.30" },
  { rating: 5, comment: "Keren!!!!", time: "08.25" },
  { rating: 3, comment: "Bingung signage gatenya", time: "15.49" },
]

const RANGKUMAN_CONTOH = [
  { title: "Total kunjungan", value: "61.500", caption: "30 hari terakhir" },
  { title: "Visitor", value: "38.900", caption: "termasuk yang tidak login" },
  { title: "Time on page", value: "2m 41d", caption: "Target: 3 menit" },
  { title: "Bounce rate", value: "36%", caption: "Target: di bawah 40%" },
]

const ASAL_TRAFFIC_CONTOH = [
  { label: "Instagram", value: "1.000", percent: 100 },
  { label: "Whatsapp", value: "1.000", percent: 80 },
  { label: "Search", value: "1.000", percent: 80 },
  { label: "Direct link", value: "1.000", percent: 60 },
  { label: "Tiktok", value: "1.000", percent: 60 },
  { label: "X", value: "1.000", percent: 40 },
  { label: "Lainnya", value: "1.000", percent: 40 },
]

const VISITOR_BERHENTI_CONTOH = [
  { label: "Landing page", value: "1.000", share: "100%", percent: 100 },
  { label: "Sign up", value: "1.000", share: "100%", percent: 80 },
  { label: "Daftar lomba", value: "1.000", share: "100%", percent: 60 },
  { label: "Bayar", value: "1.000", share: "100%", percent: 40 },
]

const ERROR_STATS_CONTOH = [
  { label: "Uptime 30 hari", value: "99,98%", note: "Target 99,9%" },
  { label: "5xx error rate, 24 jam", value: "0,03%", note: "12 dari 41.000 request" },
  { label: "Down terakhir", value: "4 menit", note: "28 November 2026" },
]

const ERROR_LINKS_CONTOH = [
  { title: "Buka PostHog", description: "Funnel, session, dan event lengkap", href: "#" },
  { title: "Vercel Speed Insights", description: "Core Web Vitals dan skor Lighthouse", href: "#" },
  { title: "Search Console", description: "Impressions, CTR, dan posisi keyword", href: "#" },
]

function Pembatas({ lane, pembungkus, oleh }: { lane: string; pembungkus: string; oleh: string }) {
  return (
    <div className={styles.pembatas}>
      <span className={styles.lane}>{lane}</span>
      <span className={styles.pembungkus}>
        pembungkus: <code>{pembungkus}</code>
      </span>
      <span className={styles.oleh}>{oleh}</span>
    </div>
  )
}

export default function AdminPreviewAllPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <AdminShellHifi
      title="Semua Widget"
      subtitle="Ketiga lane dalam satu halaman, untuk membandingkan bingkainya"
      meta={
        <>
          <AdminPill dot>Data contoh</AdminPill>
          <AdminPill>Halaman pembanding</AdminPill>
        </>
      }
    >
      <Pembatas lane="Lane Web" pembungkus="PanelHifi" oleh="nagitacahyaw + meleppz" />

      <SummaryCardsHifi items={RANGKUMAN_CONTOH} />

      <WidgetRowHifi columns="683fr 675fr">
        <BarChartHifi title="Asal Traffic" subtitle="Deskripsi" items={ASAL_TRAFFIC_CONTOH} />
        <BarChartHifi
          title="Di mana visitor berhenti"
          subtitle="Deskripsi"
          items={VISITOR_BERHENTI_CONTOH}
          variant="stacked"
        />
      </WidgetRowHifi>

      <ErrorMonitorHifi
        title="Error Monitor"
        subtitle="Monitor uptime dan error web"
        stats={ERROR_STATS_CONTOH}
        links={ERROR_LINKS_CONTOH}
      />

      <RingChartHifi
        title="Persentase Pengunjung Booth"
        subtitle="Jumlah pengunjung booth dari semua pengunjung"
        value={25}
        centerLabel="Mengunjungi Booth"
        legend={{ on: "Mengunjungi", off: "Tidak Mengunjungi" }}
        total="Total Pengunjung: 3709"
      />

      <FeedbackHifi
        title="Feedback"
        subtitle="Feedback anonim setelah scan QR booth"
        average={4.5}
        items={FEEDBACK_CONTOH}
        remaining={83}
        moreHref="/admin/feedback"
      />

      <Pembatas lane="Lane Tabel" pembungkus="GlassPanel" oleh="Neysa Alya" />

      <StaffScanTable groups={mockStaffScanGroups} />
      <TeamRegistrationTable rows={mockTeamRegistrations} competitions={mockCompetitionOptions} />

      <Pembatas lane="Lane D-Day" pembungkus="WidgetCard" oleh="Mulky Siraj Firizqi" />

      <DDayLane />
    </AdminShellHifi>
  )
}
