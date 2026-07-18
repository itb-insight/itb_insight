import type { FunnelDto } from "../../data/types"
import BarRow from "../charts/BarRow"
import Panel from "../Panel/Panel"
import styles from "./FunnelPanel.module.css"

interface FunnelPanelProps {
  data: FunnelDto
}

export default function FunnelPanel({ data }: FunnelPanelProps) {
  return (
    <Panel
      title="Registration Funnel"
      subtitle="Landing → started → completed → checked in"
      divisions={["CPT", "EV"]}
    >
      <div className={styles.stages}>
        {data.stages.map((stage) => (
          <BarRow
            key={stage.stage}
            label={stage.stage}
            value={stage.count.toLocaleString()}
            pct={stage.pct_of_entry}
          />
        ))}
      </div>

      {/* The headline drop-off point, stated in words rather than left for the
          reader to infer from four bar lengths. */}
      <p className={styles.dropoff}>
        Biggest drop-off: <strong>{data.biggest_dropoff_stage}</strong>, losing{" "}
        <strong>{data.biggest_dropoff_pct}%</strong>
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Competition</th>
            <th scope="col" className={styles.numeric}>Started</th>
            <th scope="col" className={styles.numeric}>Completed</th>
            <th scope="col" className={styles.numeric}>Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.competitions.map((row) => (
            <tr key={row.competition_id}>
              <td>{row.competition_name}</td>
              <td className={styles.numeric}>{row.started.toLocaleString()}</td>
              <td className={styles.numeric}>{row.completed.toLocaleString()}</td>
              <td className={styles.numeric}>{row.completion_rate_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}
