import {
  dataSource,
  defaultRange,
  getEngagement,
  getFunnel,
  getLive,
  getSponsorStats,
  getTraffic,
} from "@/features/admin/data/adapters"
import DivisionFilter from "@/features/admin/components/DivisionFilter/DivisionFilter"
import EngagementPanel from "@/features/admin/components/EngagementPanel/EngagementPanel"
import FunnelPanel from "@/features/admin/components/FunnelPanel/FunnelPanel"
import LiveBoothDetail from "@/features/admin/components/Live/LiveBoothDetail"
import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import PanelUnavailable from "@/features/admin/components/Panel/PanelUnavailable"
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

  const [live, funnel, sponsors, engagement, traffic] = await Promise.all([
    getLive(),
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
        meta={dataSource() === "live" ? "Live · PostHog + Supabase, last 7 days" : "Mock data"}
      />

      <div className={styles.body}>
        <LiveBoothDetail initial={live} />

        <DivisionFilter />

        <div className={styles.grid}>
          {sponsors ? <SponsorPanel data={sponsors} /> : <PanelUnavailable title="Sponsor Performance" />}
          {funnel ? <FunnelPanel data={funnel} /> : <PanelUnavailable title="Registration Funnel" />}
          {engagement ? <EngagementPanel data={engagement} /> : <PanelUnavailable title="3D Engagement Health" />}
          {traffic ? <TrafficPanel data={traffic} /> : <PanelUnavailable title="Traffic, Last 7 Days" />}
        </div>
      </div>
    </>
  )
}
