import { notFound } from "next/navigation"

import { QuestHub } from "@/features/quest"
import { MOCK_COLLECTIONS, MOCK_EASTER_EGGS, MOCK_FLASH, MOCK_MAIN_QUESTS, MOCK_STATS } from "@/features/quest/mock"

interface QuestDevPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function QuestDevPage({ searchParams }: QuestDevPageProps) {
  if (process.env.NODE_ENV === "production") notFound()

  const { tab } = await searchParams

  return (
    <QuestHub
      stats={MOCK_STATS}
      flash={MOCK_FLASH}
      mainQuests={MOCK_MAIN_QUESTS}
      collections={MOCK_COLLECTIONS}
      eggs={MOCK_EASTER_EGGS}
      basePath="/quest-dev"
      mainCount="9/24"
      initialTab={tab === "side" ? "side" : "main"}
    />
  )
}
