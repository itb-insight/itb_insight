import { notFound } from "next/navigation"

import { QuestHub } from "@/features/quest"
import QuestPageShell from "@/features/quest/QuestPageShell"

export const metadata = {
  title: "Quest Mode | ITB Insight",
  description: "Beranda quest ITB Insight.",
  robots: { index: false, follow: false },
}
import { MOCK_COLLECTIONS, MOCK_EASTER_EGGS, MOCK_FLASH, MOCK_MAIN_QUESTS, MOCK_STATS } from "@/features/quest/mock"

interface QuestPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function QuestPage({ searchParams }: QuestPageProps) {
  /*
    Isinya masih mock.ts. Hapus baris ini bersamaan dengan gerbang di
    /quest/how-to-play dan /quest/map, plus syarat NODE_ENV di MobileMenuHifi.
  */
  if (process.env.NODE_ENV === "production") notFound()

  const { tab } = await searchParams

  return (
    <QuestPageShell activeTab="quests">
      <QuestHub
        stats={MOCK_STATS}
        flash={MOCK_FLASH}
        mainQuests={MOCK_MAIN_QUESTS}
        collections={MOCK_COLLECTIONS}
        eggs={MOCK_EASTER_EGGS}
        basePath="/quest"
        mainCount="9/24"
        initialTab={tab === "side" ? "side" : "main"}
      />
    </QuestPageShell>
  )
}
