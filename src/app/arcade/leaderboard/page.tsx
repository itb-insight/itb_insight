import LeaderboardMobile from "@/features/quest/LeaderboardMobile"
import QuestPageShell from "@/features/quest/QuestPageShell"
import { publicName } from "@/features/quest-ops/format"
import { getArcadeBoard, getArcadeSettings, wibClock, type BoardEntry } from "@/lib/arcade"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Leaderboard | Insight Arcade",
  description: "Papan peringkat Insight Arcade ITB Insight.",
  robots: { index: false, follow: false },
}

const fmt = new Intl.NumberFormat("id-ID")

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

const empty = { initials: "-", name: "-", points: "0" }

// Live board (public.arcade_leaderboard, cached 15 s). Names are shortened ("Bima S.").
export default async function LeaderboardPage() {
  const supabase = await createClient()
  const [
    {
      data: { user },
    },
    board,
    settings,
  ] = await Promise.all([supabase.auth.getUser(), getArcadeBoard(), getArcadeSettings()])

  const row = (e: BoardEntry) => ({ rank: e.rank, name: publicName(e.name), quests: 0, points: fmt.format(e.points) })
  const podium = [0, 1, 2].map((i) => {
    const e = board.entries[i]
    return e ? { initials: initials(e.name), name: publicName(e.name), points: fmt.format(e.points) } : empty
  }) as [typeof empty, typeof empty, typeof empty]

  const mine = user ? board.entries.find((e) => e.userId === user.id) : undefined
  const nearby = mine && mine.rank > 10 ? board.entries.slice(Math.max(10, mine.rank - 3), mine.rank + 2).map(row) : undefined

  return (
    <QuestPageShell
      activeTab="board"
      points={mine?.points ?? (user ? board.staff.find((e) => e.userId === user.id)?.points : undefined)}
      rank={mine?.rank}
    >
      <LeaderboardMobile
        countdown=""
        freezeLabel={settings ? `DIBEKUKAN ${wibClock(settings.freezesAt)} WIB` : undefined}
        updatedLabel={`${fmt.format(board.players)} pemain`}
        podium={podium}
        rows={board.entries.slice(3, 10).map(row)}
        nearby={nearby}
        me={mine ? { rank: mine.rank, name: `Kamu · ${publicName(mine.name)}`, note: "", points: fmt.format(mine.points) } : undefined}
      />
    </QuestPageShell>
  )
}
