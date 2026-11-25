import type { LiveWebDto } from "../../data/types"
import Panel from "../Panel/Panel"
import styles from "./Live.module.css"

export default function LiveWebPanel({ data, configured }: { data: LiveWebDto | null; configured: boolean }) {
  return (
    <Panel title="Website Now" subtitle="PostHog, refreshed every 30 s">
      {!data ? (
        <p className={styles.empty} role="status">
          {configured
            ? "Couldn't load this from PostHog just now. It retries on the next refresh."
            : "PostHog query credentials are not set: no live web figures."}
        </p>
      ) : (
        <>
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Visitors, last 5 min</dt>
              <dd className={styles.statValue}>{data.active_visitors.toLocaleString()}</dd>
            </div>
          </dl>
          <h3 className={styles.subheading}>Top pages, last 30 min</h3>
          {data.top_pages.length === 0 ? (
            <p className={styles.empty}>No page views in the last 30 minutes.</p>
          ) : (
            <ul className={styles.pages}>
              {data.top_pages.map((page) => (
                <li key={page.page_path} className={styles.page}>
                  <span className={styles.path}>{page.page_path}</span>
                  <span className={styles.count}>{page.views.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  )
}
