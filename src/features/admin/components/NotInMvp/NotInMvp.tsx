import { Construction } from "lucide-react"
import PageHeader from "../PageHeader/PageHeader"
import styles from "./NotInMvp.module.css"

interface NotInMvpProps {
  title: string
  /** What this section will do once built — keeps the stub informative. */
  purpose: string
}

/**
 * Placeholder for the six sidebar routes that exist for layout fidelity but
 * are out of MVP scope. Deliberately explicit rather than a blank page, so a
 * stakeholder clicking through knows the difference between "not built yet"
 * and "broken".
 */
export default function NotInMvp({ title, purpose }: NotInMvpProps) {
  return (
    <>
      <PageHeader title={title} />
      <div className={styles.body}>
        <div className={styles.card}>
          <Construction size={20} />
          <div>
            <p className={styles.heading}>Not part of the analytics MVP</p>
            <p className={styles.purpose}>{purpose}</p>
            <p className={styles.note}>
              Scope and prerequisites are tracked in <code>docs/analytics/99-known-gaps.md</code>.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
