import type { SponsorStatDto } from "../../data/types"
import InlineBar from "../charts/InlineBar"
import Panel from "../Panel/Panel"
import styles from "./SponsorPanel.module.css"

interface SponsorPanelProps {
  data: SponsorStatDto[]
}

export default function SponsorPanel({ data }: SponsorPanelProps) {
  // Bars are scaled to the best performer, so the column reads as a ranking.
  const maxCtr = Math.max(...data.map((row) => row.ctr_percent), 1)

  return (
    <Panel
      title="Sponsor Performance"
      subtitle="Impressions vs. clicks, ranked by CTR"
      divisions={["SP"]}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Sponsor</th>
            <th scope="col">Tier</th>
            {/* Impressions is a count and CTR is a rate: two columns, never
                two axes on one chart. */}
            <th scope="col" className={styles.numeric}>Impr.</th>
            <th scope="col" className={styles.numeric}>Clicks</th>
            <th scope="col" className={styles.numeric}>CTR</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.sponsor_id}>
              <td className={styles.name}>{row.name}</td>
              {/* Tier as a text label — the palette has no colour to spare
                  for a second categorical encoding. */}
              <td className={styles.tier}>{row.tier}</td>
              <td className={styles.numeric}>{row.impressions.toLocaleString()}</td>
              <td className={styles.numeric}>{row.clicks.toLocaleString()}</td>
              <td className={styles.numeric}>
                {row.ctr_percent.toFixed(1)}%
                <InlineBar pct={(row.ctr_percent / maxCtr) * 100} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}
