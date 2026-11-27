import type { Metadata } from "next"
import { notFound } from "next/navigation"

import QuestOpsDashboard from "@/features/quest-ops/ops/QuestOpsDashboard"

export const metadata: Metadata = {
  title: "Quest Ops | ITB Insight Admin",
  robots: { index: false, follow: false },
}

// Data dummy, mati di production sampai tersambung ke API
export default function QuestOpsPage() {
  if (process.env.NODE_ENV === "production") notFound()
  return <QuestOpsDashboard />
}
