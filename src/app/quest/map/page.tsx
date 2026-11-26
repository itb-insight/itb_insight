import { notFound } from "next/navigation"

import QuestMap from "@/features/quest/QuestMap"
import QuestPageShell from "@/features/quest/QuestPageShell"

export const metadata = {
  title: "Quest Map | ITB Insight",
  description: "Peta quest ITB Insight.",
  robots: { index: false, follow: false },
}

export default function QuestMapPage() {
  /*
    Petanya masih denah sementara dari Figma ("Kolam Intel", "15 open nearby"),
    bukan peta ITB. Hapus baris ini begitu petanya yang asli masuk.
  */
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <QuestPageShell>
      <QuestMap />
    </QuestPageShell>
  )
}
