export type AgendaIcon = "page" | "announcement"

export interface Agenda {
  name: string
  date: string
  icon?: AgendaIcon
}

export const AGENDA: Agenda[] = [
  { name: "Test Agenda", date: "2026-10-08" },
  { name: "Submisi", date: "2026-10-27", icon: "page" },
  { name: "Pengumuman Finalis", date: "2026-11-10", icon: "announcement" },
]
