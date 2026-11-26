import { connection } from "next/server"
import { dataSource, getRecentEvents } from "../../data/adapters"
import Panel from "../Panel/Panel"
import PanelUnavailable from "../Panel/PanelUnavailable"
import styles from "./RecentEventsPanel.module.css"

/** Renders metadata compactly without exposing nested structures. */
function formatMetadata(metadata: Record<string, string | number | boolean | null>): string {
  const entries = Object.entries(metadata)
  if (entries.length === 0) return "—"
  return entries.map(([key, value]) => `${key}=${value}`).join(", ")
}

const TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp : TIME.format(date)
}

/**
 * Latest raw events from PostHog. Wrapped in Suspense by the page so the other panels don't
 * wait on it; `connection()` keeps it request-time (the PostHog read itself is cached ~30 s).
 */
export default async function RecentEventsPanel() {
  await connection()

  const events = await getRecentEvents(40)
  if (events === null) return <PanelUnavailable title="Recent Events" full />

  const mock = dataSource() === "mock"

  return (
    <Panel title="Recent Events" subtitle="Latest events from the site, most recent first (WIB)" full>
      {events.length === 0 ? (
        <p className={styles.empty}>
          {mock
            ? "No PostHog query key configured (POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY), so there is no live feed."
            : "No events in the last 7 days."}
        </p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Type</th>
                <th scope="col">Div</th>
                <th scope="col">Path</th>
                <th scope="col">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className={styles.time}>{formatTime(event.created_at)}</td>
                  <td className={styles.type}>{event.event_type}</td>
                  <td className={styles.div}>{event.division ?? "—"}</td>
                  <td className={styles.path}>{event.page_path}</td>
                  <td className={styles.meta}>{formatMetadata(event.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className={styles.caveat}>
        From PostHog, last 7 days, refreshed about every 30 seconds. Sampled event types
        (scroll_depth, section_impression) appear only for the sampled share.
      </p>
    </Panel>
  )
}
