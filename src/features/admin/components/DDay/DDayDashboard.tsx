"use client"

import { useState } from "react"

import AktivitasVisitorHifi from "@/features/admin-hifi/AktivitasVisitorHifi"
import KeramaianBoothHifi from "@/features/admin-hifi/KeramaianBoothHifi"
import PanelHifi from "@/features/admin-hifi/PanelHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import WidgetRowHifi from "@/features/admin-hifi/WidgetRowHifi"
import HeatmapWidget from "@/features/admin/components/HeatmapWidget/HeatmapWidget"
import LineChartWidget from "@/features/admin/components/LineChartWidget/LineChartWidget"
import { useDDayData } from "@/features/admin/components/Live/useLiveData"
import {
  BOOTH_TARGET,
  SKIPPED_GATE_LABEL,
  buildBoothBars,
  buildBoothHeatLive,
  buildFunnel,
  buildGateSeries,
  buildStaffGroups,
  formatMinutes,
  formatNumberId,
} from "@/features/admin/data/dday"
import { formatClock, type RangeKey } from "@/features/admin/data/timeRange"
import type { DDayDataDto, DDayDto } from "@/features/admin/data/types"
import StaffScanTable from "@/features/dashboard-tables/StaffScanTable"
import { AdminPageHifi, AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"

import styles from "./DDay.module.css"
import LiveVisitorsPanel from "./LiveVisitorsPanel"
import UpdatedAgoPill from "./UpdatedAgoPill"

const DATE = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" })
const AVERAGE = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 })

const clock = (iso: string) => formatClock(new Date(iso))
const median = (seconds: number | null) => (seconds === null ? "belum ada data" : `median ${formatMinutes(seconds)}`)

/**
 * /admin/d-day for every staff member: today's live headcount, check-ins, booths and staff scans.
 * Server-rendered figures first, then GET /api/admin/d-day every 30 s (admin_dday, migration 0028).
 */
export default function DDayDashboard({ initial }: { initial: DDayDto }) {
  const { data: dto, failed } = useDDayData(initial)

  return (
    <AdminPageHifi
      title="D-Day"
      subtitle="Kehadiran acara, booth, dan point"
      meta={
        <>
          <UpdatedAgoPill at={dto.generated_at} failed={failed} />
          <AdminPill>Hari ini, {DATE.format(new Date(dto.generated_at))}</AdminPill>
        </>
      }
    >
      {dto.data ? (
        <DDayWidgets data={dto.data} afterClose={dto.after_close} now={new Date(dto.generated_at)} />
      ) : (
        <PanelHifi title="Data D-Day tidak tersedia" subtitle="Gagal memuat data dari database">
          <p className={styles.unavailable}>Halaman ini mencoba lagi otomatis setiap 30 detik.</p>
        </PanelHifi>
      )}
    </AdminPageHifi>
  )
}

function DDayWidgets({ data, afterClose, now }: { data: DDayDataDto; afterClose: boolean; now: Date }) {
  const [gateRange, setGateRange] = useState<RangeKey>("12h")
  const [heatRange, setHeatRange] = useState<RangeKey>("30m")

  const { summary, funnel, medians } = data
  const gates = buildGateSeries(data.gates, gateRange, now)
  const bars = buildBoothBars(data.booths)
  const average = funnel.visitors > 0 ? summary.booth_visits / funnel.visitors : 0

  return (
    <>
      <LiveVisitorsPanel live={data.live} afterClose={afterClose} />

      <SummaryCardsHifi
        items={[
          {
            title: "Check-ins",
            value: formatNumberId(summary.check_ins),
            caption: `termasuk ${formatNumberId(summary.skipped_gate)} skipped gate`,
          },
          { title: "Booth scans", value: formatNumberId(summary.booth_scans), caption: "scan hari ini" },
          {
            title: "Points diberikan",
            value: formatNumberId(summary.points_given),
            caption: `di ${formatNumberId(summary.booths_active)} booth`,
          },
          {
            title: "Rata-rata booth/visitor",
            value: AVERAGE.format(average),
            caption: `dari target ${BOOTH_TARGET} booth`,
          },
        ]}
      />

      <LineChartWidget
        title="Keramaian"
        description="Check-in per gate"
        labels={gates.labels}
        series={gates.perGate.map((s) => (s.name === SKIPPED_GATE_LABEL ? { ...s, color: "#dee8fb" } : s))}
        range={gateRange}
        onRangeChange={setGateRange}
        unit="check-in"
      />

      <WidgetRowHifi columns="683fr 675fr">
        <KeramaianBoothHifi subtitle="Scan dan point per booth hari ini" scan={bars.scan} point={bars.point} />
        <AktivitasVisitorHifi
          subtitle="Dari pengunjung hari ini"
          items={buildFunnel(funnel)}
          median={[
            { label: "Jeda check-in ke booth pertama", value: median(medians.checkin_to_first_scan_s) },
            { label: "Jeda antar scan", value: median(medians.between_scans_s) },
          ]}
        />
      </WidgetRowHifi>

      <StaffScanTable
        groups={buildStaffGroups(data.staff, data.booths, clock)}
        title="Scan"
        subtitle="Tabel total scan dan points yang diberikan staff hari ini"
      />

      <HeatmapWidget
        title="Heat Map Keramaian"
        description="Sebaran scan booth di area acara"
        points={buildBoothHeatLive(data.booths, heatRange)}
        range={heatRange}
        onRangeChange={setHeatRange}
      />
    </>
  )
}
