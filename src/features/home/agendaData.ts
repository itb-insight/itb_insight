// Agenda shown by the Home calendar. Built on the server by src/lib/dashboard-agenda.ts from
// the event data, D-Day, and the timelines of the competitions the user is registered for.

export type AgendaKind =
  /** The main event day. */
  | "dday"
  /** Another ITB Insight event (e.g. Inspirates). */
  | "event"
  /** A competition stage: semifinal, final, pitching, submissions. */
  | "stage"
  /** Results / finalist announcements. */
  | "announcement"
  /** Technical meetings. */
  | "meeting"
  /** Registration periods. */
  | "registration"

export interface AgendaItem {
  id: string
  title: string
  /** First day, "YYYY-MM-DD" (Jakarta). Marks the calendar and orders the list. */
  date: string
  /** As the source writes it, e.g. "15 – 29 Oktober 2026". */
  dateLabel: string
  kind: AgendaKind
  /** "ITB Insight 2026" or the competition's name. */
  source: string
  /** Optional second line, e.g. the events held on D-Day. */
  detail?: string
}
