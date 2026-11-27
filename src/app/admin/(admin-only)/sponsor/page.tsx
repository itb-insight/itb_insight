import { AdminPageHifi, AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import BelumAdaHifi from "@/features/admin-hifi/BelumAdaHifi"
import PanelHifi from "@/features/admin-hifi/PanelHifi"
import RingChartHifi from "@/features/admin-hifi/RingChartHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import WidgetRowHifi from "@/features/admin-hifi/WidgetRowHifi"
import BoothVisitorsChart from "@/features/admin/components/Insights/BoothVisitorsChart"
import { count, dayLabel, percent } from "@/features/admin/components/Insights/format"
import SponsorPicker from "@/features/admin/components/Insights/SponsorPicker"
import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"
import {
  dataSource,
  getBoothInsights,
  getBoothOptions,
  getSponsorWeb,
  SPONSOR_DAYS,
  sponsorOptions,
} from "@/features/admin/data/adapters"
import type { BoothInsightsDto } from "@/features/admin/data/types"
import styles from "@/features/admin/components/Insights/Insights.module.css"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Sponsor | ITB Insight Admin",
  robots: { index: false, follow: false },
}

const UNAVAILABLE = "—"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

function BoothSection({ booth }: { booth: BoothInsightsDto }) {
  const share = booth.checked_in > 0 ? Math.min(100, Math.round((booth.visitors / booth.checked_in) * 100)) : 0
  return (
    <>
      {booth.days.length > 0 ? (
        <BoothVisitorsChart days={booth.days} />
      ) : (
        <BelumAdaHifi
          title="Jumlah Pengunjung"
          subtitle={`Pengunjung unik per jam di ${booth.name}`}
          label="Belum ada scan"
          catatan="Booth ini belum punya scan QR. Grafiknya terisi begitu pengunjung scan di booth."
        />
      )}

      <WidgetRowHifi columns="1fr 1fr" align="stretch">
        <RingChartHifi
          title="Persentase Pengunjung Booth"
          subtitle={`Visitor unik ${booth.name} dari semua visitor yang check-in`}
          value={share}
          centerLabel="Mengunjungi Booth"
          legend={{ on: "Mengunjungi", off: "Tidak Mengunjungi" }}
          total={
            booth.checked_in > 0
              ? `${count(booth.visitors)} dari ${count(booth.checked_in)} visitor check-in`
              : "Belum ada visitor yang check-in"
          }
        />
        <BelumAdaHifi
          title="Feedback"
          subtitle="Feedback anonim setelah scan QR booth"
          label="Belum ada sumber data"
          catatan="Belum ada form feedback untuk booth (feedback_forms dengan context 'booth'). Setelah ada, rating dan komentarnya bisa tampil di sini."
          tinggi={240}
        />
      </WidgetRowHifi>
    </>
  )
}

/**
 * Sponsor (Figma 1972:*): one sponsor's reach on the site (PostHog) and one booth's visitors (QR
 * scans). Sponsors and booths are not linked in the database, so the admin picks both.
 */
export default async function AdminSponsorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const sponsors = sponsorOptions()
  const requested = first(params.sponsor)
  const sponsor = sponsors.find((option) => option.id === requested) ?? sponsors[0]
  const requestedBooth = first(params.booth)
  const boothId = requestedBooth && UUID.test(requestedBooth) ? requestedBooth : null

  const [web, booths, booth] = await Promise.all([
    getSponsorWeb(sponsor.id),
    getBoothOptions(),
    boothId ? getBoothInsights(boothId) : Promise.resolve(null),
  ])
  const live = dataSource() === "live"
  const ctr = web && web.impressions > 0 ? web.clicks / web.impressions : null

  return (
    <AdminPageHifi
      title={sponsor.name}
      subtitle="Jangkauan brand dan booth di ITB Insight 2026"
      meta={
        <>
          <AdminPill dot={live}>{live ? `Live · ${SPONSOR_DAYS} hari terakhir` : "Mock data"}</AdminPill>
          <SponsorPicker
            sponsors={sponsors}
            booths={(booths ?? []).map((option) => ({ id: option.id, name: option.name }))}
            sponsor={sponsor.id}
            booth={booth?.booth_id ?? boothId}
          />
        </>
      }
    >
      <SummaryCardsHifi
        items={[
          {
            title: "Logo Impressions",
            value: web ? count(web.impressions) : UNAVAILABLE,
            caption: "section media partner tampil di layar",
          },
          { title: "Map Hotspot Dibuka", value: UNAVAILABLE, caption: "belum dilacak di peta" },
          {
            title: "Total Kunjungan Situs",
            value: web ? count(web.site_pageviews) : UNAVAILABLE,
            caption: "seluruh ITB Insight, dari PostHog",
          },
          {
            title: "Click-Through Rate",
            value: ctr === null ? UNAVAILABLE : percent(ctr),
            caption: web ? `${count(web.clicks)} klik dari ${count(web.impressions)} impressions` : "PostHog tidak tersedia",
          },
        ]}
      />

      {web ? (
        <PanelHifi title="Engagement" subtitle="Impressions section media partner & klik logo ini, per hari">
          <div className={styles.twoCharts}>
            <LineChartWidget
              bare
              title="Impressions per hari"
              labels={web.daily.map((row) => dayLabel(row.day))}
              series={[{ name: "Impressions per hari", values: web.daily.map((row) => row.impressions), color: "#fffc86" }]}
              area
              unit="impression"
            />
            <LineChartWidget
              bare
              title="Klik per hari"
              labels={web.daily.map((row) => dayLabel(row.day))}
              series={[{ name: "Klik per hari", values: web.daily.map((row) => row.clicks), color: "#acc7ff" }]}
              area
              unit="klik"
            />
          </div>
        </PanelHifi>
      ) : (
        <BelumAdaHifi title="Engagement" label="Tidak tersedia" catatan="Query PostHog gagal. Coba muat ulang dalam beberapa menit." />
      )}

      {booth ? (
        <BoothSection booth={booth} />
      ) : (
        <BelumAdaHifi
          title="Booth"
          subtitle="Pengunjung, persentase kunjungan, dan feedback booth"
          label={boothId ? "Booth tidak ditemukan" : "Pilih booth"}
          catatan={
            boothId
              ? "Booth ini tidak ada atau query-nya gagal. Pilih booth lain di kanan atas."
              : "Sponsor dan booth belum terhubung di database. Pilih booth sponsor ini di kanan atas untuk melihat pengunjungnya."
          }
        />
      )}
    </AdminPageHifi>
  )
}
