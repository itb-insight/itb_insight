import { Suspense } from "react"
import {
  dataSource,
  defaultRange,
  getDivisionActivity,
  getEngagement,
  getFunnel,
  getKpis,
  getSponsorStats,
  getTraffic,
} from "@/features/admin/data/adapters"
import DivisionActivityPanel from "@/features/admin/components/DivisionActivityPanel/DivisionActivityPanel"
import DivisionFilter from "@/features/admin/components/DivisionFilter/DivisionFilter"
import EngagementPanel from "@/features/admin/components/EngagementPanel/EngagementPanel"
import FunnelPanel from "@/features/admin/components/FunnelPanel/FunnelPanel"
import KpiStrip from "@/features/admin/components/KpiStrip/KpiStrip"
import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import PanelUnavailable from "@/features/admin/components/Panel/PanelUnavailable"
import RecentEventsPanel from "@/features/admin/components/RecentEventsPanel/RecentEventsPanel"
import SponsorPanel from "@/features/admin/components/SponsorPanel/SponsorPanel"
import TrafficPanel from "@/features/admin/components/TrafficPanel/TrafficPanel"
import styles from "./dashboard.module.css"

export default async function AdminDashboardPage() {
  const range = defaultRange()

  // All through the adapter seam: PostHog + Supabase when the PostHog query key is set, mock
  // figures otherwise. A null is a source that failed; its panel says so.
  const [kpis, activity, funnel, sponsors, engagement, traffic] = await Promise.all([
    getKpis(range),
    getDivisionActivity(range),
    getFunnel(range),
    getSponsorStats(range),
    getEngagement(range),
    getTraffic(range),
  ])

  const totalEvents = activity?.reduce((sum, row) => sum + row.events, 0) ?? 0

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Cross-division overview"
        meta={dataSource() === "live" ? "Live · PostHog + Supabase, last 7 days" : "Mock data"}
      />

      <div className={styles.body}>
        <DivisionFilter />
        <KpiStrip items={kpis} />

        <div className={styles.grid}>
          {activity ? (
            <DivisionActivityPanel data={activity} total={totalEvents} />
          ) : (
            <PanelUnavailable title="Activity by Division" />
          )}
          {funnel ? <FunnelPanel data={funnel} /> : <PanelUnavailable title="Registration Funnel" />}
          {sponsors ? <SponsorPanel data={sponsors} /> : <PanelUnavailable title="Sponsor Performance" />}
          {engagement ? <EngagementPanel data={engagement} /> : <PanelUnavailable title="3D Engagement Health" />}
          {traffic ? <TrafficPanel data={traffic} /> : <PanelUnavailable title="Traffic, Last 7 Days" />}

          {/* Suspense keeps the panels above from waiting on the live feed. */}
          <Suspense fallback={<div className={styles.loading}>Loading recent events…</div>}>
            <RecentEventsPanel />
          </Suspense>
        </div>
      </div>
    </>
  )
}
