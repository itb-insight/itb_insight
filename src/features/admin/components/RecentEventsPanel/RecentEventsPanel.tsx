import { connection } from "next/server"
import { getRecentEvents } from "../../data/adapters"
import Panel from "../Panel/Panel"
import styles from "./RecentEventsPanel.module.css"

/** Renders metadata compactly without exposing nested structures. */
function formatMetadata(metadata: Record<string, string | number | boolean | null>): string {
  const entries = Object.entries(metadata)
  if (entries.length === 0) return "—"
  return entries.map(([key, value]) => `${key}=${value}`).join(", ")
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour12: false })
}

/**
 * The only live-data panel on the dashboard.
 *
 * `await connection()` is required: this reads mutable module state and
 * touches no other request-time API, so without it Next would prerender the
 * panel at build and serve a frozen empty list forever. Isolating it in its
 * own component keeps the surrounding mock-driven panels static.
 */
export default async function RecentEventsPanel() {
  await connection()

  const events = await getRecentEvents(40)

  return (
    <Panel
      title="Recent Events"
      subtitle="Live raw event feed from this server process — most recent first"
      full
    >
      {events.length === 0 ? (
        <p className={styles.empty}>
          No events captured yet. Browse the public site in another tab, then reload — the buffer
          fills as batches arrive.
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
                  <td className={styles.div}>{event.division}</td>
                  <td className={styles.path}>{event.page_path}</td>
                  <td className={styles.meta}>{formatMetadata(event.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className={styles.caveat}>
        In-memory ring buffer, capped at 500 events and scoped to one server process. It clears on
        restart and shows only a partial slice of traffic — it proves ingest works, it is not the
        analytics store. Every other panel reads mock data.
      </p>
    </Panel>
  )
}
