import type { Metadata } from "next"
import { notFound } from "next/navigation"

import QuestLivePage from "@/features/quest-ops/live/QuestLivePage"

export const metadata: Metadata = {
  title: "Leaderboard Quest Mode | ITB Insight",
  robots: { index: false, follow: false },
}

// Data dummy, mati di production sampai tersambung ke API
export default function QuestLiveRoute() {
  if (process.env.NODE_ENV === "production") notFound()
  return <QuestLivePage />
}
