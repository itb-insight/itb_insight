import { notFound } from "next/navigation"

import AdminShellHifi, { AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import BarChartHifi from "@/features/admin-hifi/BarChartHifi"
import ErrorMonitorHifi from "@/features/admin-hifi/ErrorMonitorHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import WidgetRowHifi from "@/features/admin-hifi/WidgetRowHifi"

import KunjunganChart from "./KunjunganChart"

export const metadata = {
  title: "Web | ITB Insight Admin",
  robots: { index: false, follow: false },
}

const RANGKUMAN = [
  { title: "Total kunjungan", value: "61.500", caption: "30 hari terakhir" },
  { title: "Visitor", value: "38.900", caption: "termasuk yang tidak login" },
  { title: "Time on page", value: "2M 41D", caption: "Target: 3 menit" },
  { title: "Bounce rate", value: "36%", caption: "Target: di bawah 40%" },
]

const ASAL_TRAFFIC = [
  { label: "Instagram", value: "1.000", percent: 100 },
  { label: "Whatsapp", value: "1.000", percent: 80 },
  { label: "Search", value: "1.000", percent: 80 },
  { label: "Direct link", value: "1.000", percent: 60 },
  { label: "Tiktok", value: "1.000", percent: 60 },
  { label: "X", value: "1.000", percent: 40 },
  { label: "Lainnya", value: "1.000", percent: 40 },
]

const VISITOR_BERHENTI = [
  { label: "Landing page", value: "1.000", share: "100%", percent: 100 },
  { label: "Sign up", value: "1.000", share: "100%", percent: 80 },
  { label: "Daftar lomba", value: "1.000", share: "100%", percent: 60 },
  { label: "Bayar", value: "1.000", share: "100%", percent: 40 },
]

const ERROR_STATS = [
  { label: "Uptime 30 hari", value: "99,98%", note: "Target 99,9%" },
  { label: "5xx error rate, 24 jam", value: "0,03%", note: "12 dari 41.000 request" },
  { label: "Down terakhir", value: "4 menit", note: "28 November 2026" },
]

const ERROR_LINKS = [
  { title: "Buka PostHog", description: "Funnel, session, dan event lengkap", href: "#" },
  { title: "Vercel Speed Insights", description: "Core Web Vitals dan skor Lighthouse", href: "#" },
  { title: "Search Console", description: "Impressions, CTR, dan posisi keyword", href: "#" },
]

export default function AdminWebPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <AdminShellHifi
      title="Web"
      subtitle="Traffic website"
      activeHref="/admin-hifi/web"
      meta={
        <>
          <AdminPill dot>Diperbarui 12 detik lalu</AdminPill>
          <AdminPill>Webdev + Admin</AdminPill>
        </>
      }
    >
      <SummaryCardsHifi items={RANGKUMAN} />

      <KunjunganChart />

      <WidgetRowHifi columns="1fr 1fr">
        <BarChartHifi title="Asal Traffic" subtitle="Deskripsi" items={ASAL_TRAFFIC} />
        <BarChartHifi
          title="Di mana visitor berhenti"
          subtitle="Deskripsi"
          items={VISITOR_BERHENTI}
          variant="stacked"
        />
      </WidgetRowHifi>

      <ErrorMonitorHifi
        title="Error Monitor"
        subtitle="Monitor uptime dan error web"
        stats={ERROR_STATS}
        links={ERROR_LINKS}
      />
    </AdminShellHifi>
  )
}
