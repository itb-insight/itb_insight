import Panel from "./Panel"
import styles from "./Panel.module.css"

interface PanelUnavailableProps {
  title: string
  full?: boolean
  /** Which source failed. */
  source?: string
}

/** Stands in for a panel whose live source failed, instead of showing zeros that look real. */
export default function PanelUnavailable({ title, full, source = "PostHog" }: PanelUnavailableProps) {
  return (
    <Panel title={title} full={full}>
      <p className={styles.unavailable} role="status">
        Couldn&apos;t load this from {source} just now. It retries on the next reload; the server
        log has the error.
      </p>
    </Panel>
  )
}
