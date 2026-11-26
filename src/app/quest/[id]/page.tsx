import { notFound } from "next/navigation"

import { QuestDetail } from "@/features/quest"
import QuestPageShell from "@/features/quest/QuestPageShell"

export const metadata = {
  title: "Quest | ITB Insight",
  description: "Detail quest ITB Insight.",
  robots: { index: false, follow: false },
}
import { getQuestDetail } from "@/features/quest/mock"

interface QuestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function QuestDetailPage({ params }: QuestDetailPageProps) {
  /*
    Isinya masih mock.ts — lihat catatan di ../page.tsx.

    Segmen dinamis ini bertetangga dengan route statis /quest/map,
    /quest/leaderboard, /quest/rewards, /quest/history, /quest/how-to-play dan
    /quest/preview. Next mendahulukan yang statis, jadi id quest TIDAK BOLEH
    sama dengan salah satu nama itu — kalau sama, halaman statisnya yang menang.
  */
  if (process.env.NODE_ENV === "production") notFound()

  const { id } = await params
  const quest = getQuestDetail(id)
  if (!quest) notFound()

  return (
    <QuestPageShell>
      <QuestDetail quest={quest} backHref="/quest" />
    </QuestPageShell>
  )
}
