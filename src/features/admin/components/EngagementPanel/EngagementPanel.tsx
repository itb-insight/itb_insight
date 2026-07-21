import { TriangleAlert } from "lucide-react"
import type { EngagementDto } from "../../data/types"
import BarRow from "../charts/BarRow"
import RadialMeter from "../charts/RadialMeter"
import Panel from "../Panel/Panel"
import styles from "./EngagementPanel.module.css"

interface EngagementPanelProps {
  data: EngagementDto
}

function ratingFor(pct: number): string {
  if (pct >= 75) return "Healthy"
  if (pct >= 50) return "Degraded"
  return "Poor"
}

export default function EngagementPanel({ data }: EngagementPanelProps) {
  return (
    <Panel
      title="3D Engagement Health"
      subtitle="Scroll depth and device performance"
      divisions={["EV", "CB"]}
    >
      <RadialMeter
        value={data.avg_scroll_depth_pct}
        caption="avg scroll depth reached"
        rating={ratingFor(data.avg_scroll_depth_pct)}
      />

      <dl className={styles.perf}>
        <div>
          <dt>Drone ready p50</dt>
          <dd>{data.drone_ready_ms_p50} ms</dd>
        </div>
        <div>
          <dt>Drone ready p90</dt>
          <dd>{data.drone_ready_ms_p90} ms</dd>
        </div>
      </dl>
      {/* Naming this honestly matters: real time-to-interactive is not
          measurable from userland. This is mount to first rendered frame. */}
      <p className={styles.perfNote}>
        Measured mount → first rendered frame, not time-to-interactive.
      </p>

      <div className={styles.devices}>
        {data.devices.map((device) => (
          <BarRow
            key={device.device_class}
            label={device.device_class}
            value={`${device.avg_scroll_depth}%`}
            pct={device.avg_scroll_depth}
          />
        ))}
      </div>

      {data.alert && (
        <div className={styles.alert} role="note">
          <TriangleAlert size={16} />
          <div>
            {/* Severity is signalled by the icon and the word, not by colour. */}
            <strong className={styles.alertLabel}>Warning</strong>
            <p className={styles.alertBody}>{data.alert}</p>
          </div>
        </div>
      )}
    </Panel>
  )
}
