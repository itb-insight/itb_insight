import ArcadeHub from "@/features/quest/ArcadeHub"
import QuestPageShell from "@/features/quest/QuestPageShell"
import { getArcadePlayer, type ArcadePlayer } from "@/lib/arcade"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Insight Arcade | ITB Insight",
  robots: { index: false, follow: false },
}

// Insight Arcade hub: real points, rank, areas, side quests and collections (src/lib/arcade.ts).
export default async function ArcadePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let player: ArcadePlayer | null = null
  if (user) {
    try {
      player = await getArcadePlayer(user.id)
    } catch (err) {
      console.error("[arcade] player summary failed", err)
    }
  }

  return (
    <QuestPageShell activeTab="quests" points={player?.points} rank={player?.rank}>
      <ArcadeHub player={player} signedIn={Boolean(user)} />
    </QuestPageShell>
  )
}
