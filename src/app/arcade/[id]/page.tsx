import { notFound, redirect } from "next/navigation"

import QuestPageShell from "@/features/quest/QuestPageShell"
import SideQuestView from "@/features/quest/SideQuestView"
import { canUploadProof, getArcadePlayer, getDroneTeams } from "@/lib/arcade"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "Side Quest | Insight Arcade", robots: { index: false, follow: false } }

// A side quest (slug arcade-*). Static siblings (area, qr, leaderboard, how-to-play, ...) win over
// this segment, so quest slugs all start with "arcade-".
export default async function SideQuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arcade/${encodeURIComponent(id)}`)

  const player = await getArcadePlayer(user.id)
  const quest = player.sideQuests.find((q) => q.slug === id)
  if (!quest) notFound()

  const canUpload = canUploadProof(quest)
  const teams = canUpload && quest.needsVote ? await getDroneTeams() : undefined

  return (
    <QuestPageShell points={player.points} rank={player.rank}>
      <SideQuestView sideQuest={quest} canUpload={canUpload} teams={teams} />
    </QuestPageShell>
  )
}
