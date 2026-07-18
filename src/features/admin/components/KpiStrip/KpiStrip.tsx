import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { KpiDto, TrendDirection } from "../../data/types"
import styles from "./KpiStrip.module.css"

interface KpiStripProps {
  items: KpiDto[]
}

/** Direction is carried by an icon and a word, never by colour alone. */
const DIRECTION_ICON: Record<TrendDirection, React.ComponentType<{ size?: number }>> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
}

const DIRECTION_LABEL: Record<TrendDirection, string> = {
  up: "Up",
  down: "Down",
  flat: "Flat",
}

export default function KpiStrip({ items }: KpiStripProps) {
  return (
    <div className={styles.strip}>
      {items.map((item) => {
        const Icon = DIRECTION_ICON[item.direction]

        return (
          <article key={item.id} className={styles.card}>
            <h3 className={styles.label}>{item.label}</h3>
            <p className={styles.value}>{item.value}</p>
            <p className={styles.delta}>
              <Icon size={13} />
              <span className={styles.srOnly}>{DIRECTION_LABEL[item.direction]}: </span>
              {item.delta}
            </p>
          </article>
        )
      })}
    </div>
  )
}
