import { notFound, redirect } from "next/navigation"

import ArcadeAreaView from "@/features/quest/ArcadeAreaView"
import QuestPageShell from "@/features/quest/QuestPageShell"
import { canUploadProof, getArcadePlayer, getDroneTeams } from "@/lib/arcade"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "Insight Arcade | ITB Insight", robots: { index: false, follow: false } }

// One area of the main quest (Tech-Xhibition, Play-Tech, ...): its booths, which ones you visited,
// and the area's photo side quests with their upload form.
export default async function ArcadeAreaPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arcade/area/${encodeURIComponent(category)}`)

  const player = await getArcadePlayer(user.id)
  const area = player.areas.find((a) => a.category === category)
  if (!area) notFound()

  const sideQuests = player.sideQuests
    .filter((q) => q.area === area.category && q.verify === "proof")
    .map((q) => ({ quest: q, canUpload: canUploadProof(q) }))
  const teams = sideQuests.some((s) => s.canUpload && s.quest.needsVote) ? await getDroneTeams() : undefined

  return (
    <QuestPageShell activeTab="quests" points={player.points} rank={player.rank}>
      <ArcadeAreaView area={area} sideQuests={sideQuests} teams={teams} />
    </QuestPageShell>
  )
}
