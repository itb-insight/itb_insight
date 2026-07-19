import { Suspense } from "react"
import {
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
import RecentEventsPanel from "@/features/admin/components/RecentEventsPanel/RecentEventsPanel"
import SponsorPanel from "@/features/admin/components/SponsorPanel/SponsorPanel"
import TrafficPanel from "@/features/admin/components/TrafficPanel/TrafficPanel"
import styles from "./dashboard.module.css"

export default async function AdminDashboardPage() {
  const range = defaultRange()

  // Every one of these reads the mock layer through the adapter seam. Only
  // RecentEventsPanel touches live state, which is why it is isolated below.
  const [kpis, activity, funnel, sponsors, engagement, traffic] = await Promise.all([
    getKpis(range),
    getDivisionActivity(range),
    getFunnel(range),
    getSponsorStats(range),
    getEngagement(range),
    getTraffic(range),
  ])

  const totalEvents = activity.reduce((sum, row) => sum + row.events, 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Cross-division overview"
        meta="Mock data · live feed below"
      />

      <div className={styles.body}>
        <DivisionFilter />
        <KpiStrip items={kpis} />

        <div className={styles.grid}>
          <DivisionActivityPanel data={activity} total={totalEvents} />
          <FunnelPanel data={funnel} />
          <SponsorPanel data={sponsors} />
          <EngagementPanel data={engagement} />
          <TrafficPanel data={traffic} />

          {/* Suspense keeps the static panels above from waiting on the
              request-time read inside RecentEventsPanel. */}
          <Suspense fallback={<div className={styles.loading}>Loading recent events…</div>}>
            <RecentEventsPanel />
          </Suspense>
        </div>
      </div>
    </>
  )
}
