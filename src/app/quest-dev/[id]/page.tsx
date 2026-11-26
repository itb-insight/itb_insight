import { notFound } from "next/navigation"

import { QuestDetail } from "@/features/quest"
import { getQuestDetail } from "@/features/quest/mock"

interface QuestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function QuestDetailDevPage({ params }: QuestDetailPageProps) {
  if (process.env.NODE_ENV === "production") notFound()

  const { id } = await params
  const quest = getQuestDetail(id)
  if (!quest) notFound()

  return <QuestDetail quest={quest} backHref="/quest-dev" />
}
