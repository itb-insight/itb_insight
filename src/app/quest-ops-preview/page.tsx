import type { Metadata } from "next"
import { notFound } from "next/navigation"

import QuestOpsDashboard from "@/features/quest-ops/ops/QuestOpsDashboard"

export const metadata: Metadata = {
  title: "Preview Quest Ops | ITB Insight",
  robots: { index: false, follow: false },
}

// Preview lokal tanpa login admin, hapus setelah data asli tersambung
export default function QuestOpsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  return <QuestOpsDashboard />
}
