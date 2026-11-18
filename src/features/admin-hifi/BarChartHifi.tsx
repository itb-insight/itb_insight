import PanelHifi from "./PanelHifi"
import ProgressBarHifi from "./ProgressBarHifi"
import styles from "./BarChartHifi.module.css"

export interface BarItemHifi {
  label: string
  /** Angka yang ditampilkan, sudah diformat, misal "1.000" */
  value: string
  /** Panjang bar, 0–100 */
  percent: number
  /** Teks kecil di sebelah angka (hanya varian stacked), misal "100%" */
  share?: string
}

interface BarChartHifiProps {
  title: string
  subtitle?: string
  items: BarItemHifi[]
  /**
   * inline  = label | bar | angka dalam satu baris (Asal Traffic)
   * stacked = label & angka di atas, bar di bawah (Di mana visitor berhenti)
   */
  variant?: "inline" | "stacked"
}

export default function BarChartHifi({
  title,
  subtitle,
  items,
  variant = "inline",
}: BarChartHifiProps) {
  return (
    <PanelHifi title={title} subtitle={subtitle}>
      <ul className={styles.list}>
        {items.map((item) =>
          variant === "inline" ? (
            <li key={item.label} className={styles.inlineRow}>
              <p className={styles.text}>{item.label}</p>
              <ProgressBarHifi value={item.percent} label={item.label} />
              <p className={styles.text}>{item.value}</p>
            </li>
          ) : (
            <li key={item.label} className={styles.stackedRow}>
              <div className={styles.stackedHead}>
                <p className={styles.text}>{item.label}</p>
                <p className={styles.text}>
                  {item.value}
                  {item.share ? (
                    <>
                      {" "}
                      <span className={styles.share}>{item.share}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <ProgressBarHifi value={item.percent} label={item.label} />
            </li>
          ),
        )}
      </ul>
    </PanelHifi>
  )
}
