import type { TrafficDto } from "../../data/types"
import Sparkline from "../charts/Sparkline"
import Panel from "../Panel/Panel"
import styles from "./TrafficPanel.module.css"

interface TrafficPanelProps {
  data: TrafficDto
}

export default function TrafficPanel({ data }: TrafficPanelProps) {
  return (
    <Panel title="Traffic, Last 7 Days" subtitle="All divisions combined">
      <Sparkline points={data.series} label="Daily page views" />

      <ul className={styles.pages}>
        {data.top_pages.map((page) => (
          <li key={page.page_path} className={styles.page}>
            <span className={styles.path}>{page.page_path}</span>
            <span className={styles.count}>{page.views.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
