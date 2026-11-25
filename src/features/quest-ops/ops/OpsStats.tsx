import { formatCount } from "../format"
import type { QuestOpsStats } from "../types"
import styles from "./QuestOps.module.css"

export default function OpsStats({ stats }: { stats: QuestOpsStats }) {
  const perPlayer = stats.players > 0 ? (stats.questsDone / stats.players).toFixed(1) : "0"
  const redemptions = stats.redemptions.merch + stats.redemptions.sponsor

  const cards = [
    { label: "PLAYERS", value: formatCount(stats.players), hint: "signed in to Quest Mode" },
    {
      label: "PARTICIPATION",
      value: `${stats.participationPct}%`,
      hint: `of ${formatCount(stats.attendance)} attendance counted by Events`,
    },
    { label: "QUESTS DONE", value: formatCount(stats.questsDone), hint: `${perPlayer} per player` },
    { label: "BOOTH VISITS", value: formatCount(stats.boothVisits), hint: "unique, verified by staff code" },
    {
      label: "REDEMPTIONS",
      value: formatCount(redemptions),
      hint: `merch ${stats.redemptions.merch} · sponsor ${stats.redemptions.sponsor}`,
    },
  ]

  return (
    <dl className={styles.stats}>
      {cards.map((c) => (
        <div key={c.label} className={styles.stat}>
          <dt className={styles.statLabel}>{c.label}</dt>
          <dd className={styles.statValue}>{c.value}</dd>
          <dd className={styles.statHint}>{c.hint}</dd>
        </div>
      ))}
    </dl>
  )
}
