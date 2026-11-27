import { notFound } from "next/navigation"

import AdminShellHifi, { AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import RingChartHifi from "@/features/admin-hifi/RingChartHifi"
import FeedbackHifi from "@/features/admin-hifi/FeedbackHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import BarChartHifi from "@/features/admin-hifi/BarChartHifi"
import ErrorMonitorHifi from "@/features/admin-hifi/ErrorMonitorHifi"
import WidgetRowHifi from "@/features/admin-hifi/WidgetRowHifi"

export const metadata = {
  title: "Admin Web (hi-fi) | ITB Insight",
  description: "Preview sementara halaman admin Web versi hi-fi.",
}

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

/* Isi contoh lane 3 — teks dan angka disalin apa adanya dari Figma "Page Web". */
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
  { label: "DIrect link", value: "1.000", percent: 60 },
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
  { label: "Down terakhir", value: "4 menit", note: "28 N0vember 2026" },
]

const ERROR_LINKS_CONTOH = [
  { title: "Buka PostHog", description: "Funnel, session, dan event lengkap", href: "#" },
  { title: "Vercel Speed Insights", description: "Core WEb Vitals dan skor Lighthouse", href: "#" },
  { title: "Search Console", description: "Impressions, CTW, dan posisi keyword", href: "#" },
]

export default function AdminWebHifiPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <AdminShellHifi
      title="Web"
      subtitle="Traffic website"
      activeHref="/admin/web"
      meta={
        <>
          <AdminPill dot>Diperbarui 12 detik lalu</AdminPill>
          <AdminPill>Webdev + Admin</AdminPill>
        </>
      }
    >
      {/* lane 3: Rangkuman, Bar Chart 1 + 2, Error Monitor — urutan sesuai Figma "Page Web" */}
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
        subtitle="Monitor uptime dan wrror web"
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
    </AdminShellHifi>
  )
}
