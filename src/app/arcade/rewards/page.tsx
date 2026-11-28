import QuestPageShell from "@/features/quest/QuestPageShell"
import RewardsMobile from "@/features/quest/RewardsMobile"
import { buildRewardsView } from "@/features/quest/rewardsView"
import { getArcadeBoard, getArcadeSettings, getPlayerPrizes, wibClock, type PlayerPrizes } from "@/lib/arcade"
import { isMapsDisabled, PRIZE_DESK_MAP_HREF } from "@/lib/maps"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Rewards | Insight Arcade",
  description: "Hadiah Insight Arcade ITB Insight.",
  robots: { index: false, follow: false },
}

const fmt = new Intl.NumberFormat("id-ID")

// Insight Arcade prizes (src/features/quest/rewardsView.ts): no wallet, points only rank players.
// Sticker any time after a quest; Mug / Keychain after the final results, at Booth Entrepreneur.
export default async function RewardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const empty: PlayerPrizes = { committee: false, published: false, resultRank: null, prizes: [] }
  const [board, settings, prizes] = await Promise.all([
    getArcadeBoard().catch((err) => {
      console.error("[arcade-rewards] board failed", err)
      return { players: 0, entries: [], staff: [] }
    }),
    getArcadeSettings(),
    getPlayerPrizes(user?.id ?? null).catch((err) => {
      console.error("[arcade-rewards] prizes failed", err)
      return empty
    }),
  ])

  const mine = user ? board.entries.find((e) => e.userId === user.id) : undefined
  const points = mine?.points ?? (user ? board.staff.find((e) => e.userId === user.id)?.points : undefined) ?? 0
  const view = buildRewardsView({
    signedIn: Boolean(user),
    committee: prizes.committee,
    published: prizes.published,
    resultRank: prizes.resultRank,
    rank: mine?.rank ?? null,
    points,
    top10Points: board.entries[9]?.points ?? null,
    freezeClock: settings ? wibClock(settings.freezesAt) : null,
    prizes: prizes.prizes,
    clock: wibClock,
  })

  return (
    <QuestPageShell activeTab="rewards" points={points} rank={mine?.rank}>
      <RewardsMobile
        summary={{ points: fmt.format(points), rank: mine ? `#${mine.rank}` : "-" }}
        claim={view.claim}
        rewards={view.rewards}
        youAre={view.youAre}
        where={
          isMapsDisabled()
            ? { label: "Ambil hadiah di Booth Entrepreneur (area Food & Beverages).", href: null }
            : { label: "Ambil hadiah di Booth Entrepreneur (area Food & Beverages). Lihat di peta", href: PRIZE_DESK_MAP_HREF }
        }
        historyHref={user ? "/arcade/history" : undefined}
      />
    </QuestPageShell>
  )
}
