import {
  defaultRange,
  getEngagement,
  getFunnel,
  getSponsorStats,
  getTraffic,
} from "@/features/admin/data/adapters"
import DivisionFilter from "@/features/admin/components/DivisionFilter/DivisionFilter"
import EngagementPanel from "@/features/admin/components/EngagementPanel/EngagementPanel"
import FunnelPanel from "@/features/admin/components/FunnelPanel/FunnelPanel"
import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import SponsorPanel from "@/features/admin/components/SponsorPanel/SponsorPanel"
import TrafficPanel from "@/features/admin/components/TrafficPanel/TrafficPanel"
import styles from "../dashboard.module.css"

/**
 * The three dashboards named in the spec, on one page: Sponsor, Funnel, and
 * Engagement. The main Dashboard route is the cross-division summary; this is
 * where each division's own numbers live.
 */
export default async function AdminAnalyticsPage() {
  const range = defaultRange()

  const [funnel, sponsors, engagement, traffic] = await Promise.all([
    getFunnel(range),
    getSponsorStats(range),
    getEngagement(range),
    getTraffic(range),
  ])

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Sponsor, funnel, and engagement detail"
        meta="Mock data"
      />

      <div className={styles.body}>
        <DivisionFilter />

        <div className={styles.grid}>
          <SponsorPanel data={sponsors} />
          <FunnelPanel data={funnel} />
          <EngagementPanel data={engagement} />
          <TrafficPanel data={traffic} />
        </div>
      </div>
    </>
  )
}
