import { AdminPageHifi, AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import BarChartHifi from "@/features/admin-hifi/BarChartHifi"
import BelumAdaHifi from "@/features/admin-hifi/BelumAdaHifi"
import ErrorMonitorHifi from "@/features/admin-hifi/ErrorMonitorHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import WidgetRowHifi from "@/features/admin-hifi/WidgetRowHifi"
import { count, minutesSeconds, percent } from "@/features/admin/components/Insights/format"
import WebVisitsChart from "@/features/admin/components/Insights/WebVisitsChart"
import {
  dataSource,
  funnelShares,
  getWebInsights,
  TRAFFIC_SOURCES,
  WEB_SUMMARY_DAYS,
} from "@/features/admin/data/adapters"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Web | ITB Insight Admin",
  robots: { index: false, follow: false },
}

const UNAVAILABLE = "—"

/** Where the external tools live. The PostHog link is built from the server's own settings. */
function monitorLinks() {
  const project = process.env.POSTHOG_PROJECT_ID?.trim()
  const region = process.env.NEXT_PUBLIC_POSTHOG_REGION
  const posthog =
    project && /^\d+$/.test(project) && (region === "us" || region === "eu")
      ? `https://${region}.posthog.com/project/${project}`
      : "https://app.posthog.com"
  return [
    { title: "Buka PostHog", description: "Funnel, session, dan event lengkap", href: posthog },
    { title: "Vercel", description: "Speed Insights, log, dan status deploy", href: "https://vercel.com/dashboard" },
    { title: "Search Console", description: "Impressions, CTR, dan posisi keyword", href: "https://search.google.com/search-console" },
  ]
}

/** Web (Figma "Web / Traffic website"): site traffic from PostHog, plus paid registrations. */
export default async function AdminWebPage() {
  const web = await getWebInsights()
  const live = dataSource() === "live"
  const { summary, daily, sources, funnel } = web

  const sourceTotal = sources?.reduce((max, row) => Math.max(max, row.sessions), 0) ?? 0
  const label = (key: string) => TRAFFIC_SOURCES.find((s) => s.key === key)?.label ?? key

  return (
    <AdminPageHifi
      title="Web"
      subtitle="Traffic website"
      meta={
        <>
          <AdminPill dot={live}>{live ? "Live · PostHog" : "Mock data"}</AdminPill>
          <AdminPill>{WEB_SUMMARY_DAYS} hari terakhir</AdminPill>
        </>
      }
    >
      <SummaryCardsHifi
        items={[
          {
            title: "Total kunjungan",
            value: summary ? count(summary.pageviews) : UNAVAILABLE,
            caption: summary ? "page view" : "PostHog tidak tersedia",
          },
          {
            title: "Visitor",
            value: summary ? count(summary.visitors) : UNAVAILABLE,
            caption: "browser unik, termasuk yang tidak login",
          },
          {
            title: "Rata-rata sesi",
            value: summary ? minutesSeconds(summary.avg_session_s) : UNAVAILABLE,
            caption: "Target: 3 menit",
          },
          {
            title: "Bounce rate",
            value: summary ? percent(summary.bounce_pct / 100, 0) : UNAVAILABLE,
            caption: "sesi 1 halaman. Target: di bawah 40%",
          },
        ]}
      />

      {daily ? (
        <WebVisitsChart daily={daily} />
      ) : (
        <BelumAdaHifi title="Kunjungan" label="Tidak tersedia" catatan="Query PostHog gagal. Coba muat ulang dalam beberapa menit." />
      )}

      <WidgetRowHifi columns="1fr 1fr">
        {sources ? (
          <BarChartHifi
            title="Asal Traffic"
            subtitle="Sesi per sumber: utm_source, lalu domain perujuk"
            items={sources.map((row) => ({
              label: label(row.source),
              value: count(row.sessions),
              percent: sourceTotal > 0 ? (row.sessions / sourceTotal) * 100 : 0,
            }))}
          />
        ) : (
          <BelumAdaHifi title="Asal Traffic" label="Tidak tersedia" catatan="Query PostHog gagal." />
        )}
        {funnel ? (
          <BarChartHifi
            title="Di mana visitor berhenti"
            subtitle="Visitor unik per langkah; Bayar = pembayaran Midtrans lunas"
            variant="stacked"
            items={funnelShares(funnel).map((row) => ({
              label: row.step,
              value: count(row.count),
              share: `${row.share}%`,
              percent: row.share,
            }))}
          />
        ) : (
          <BelumAdaHifi title="Di mana visitor berhenti" label="Tidak tersedia" catatan="Query PostHog gagal." />
        )}
      </WidgetRowHifi>

      <ErrorMonitorHifi
        title="Error Monitor"
        subtitle="Monitor uptime dan error web"
        stats={[
          { label: "Uptime 30 hari", value: UNAVAILABLE, note: "Belum ada monitor uptime" },
          { label: "5xx error rate, 24 jam", value: UNAVAILABLE, note: "Lihat log di Vercel" },
          { label: "Down terakhir", value: UNAVAILABLE, note: "Belum ada monitor uptime" },
        ]}
        links={monitorLinks()}
      />
    </AdminPageHifi>
  )
}
