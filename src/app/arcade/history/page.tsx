import { redirect } from "next/navigation"

import {
  HISTORY_FILTERS,
  historyReference,
  matchesFilter,
  parseHistoryFilter,
  toHistoryEntry,
} from "@/features/quest/historyView"
import PointsHistoryMobile from "@/features/quest/PointsHistoryMobile"
import QuestPageShell from "@/features/quest/QuestPageShell"
import { getArcadeBoard, getPointsHistory, wibClock, type PointsEvent } from "@/lib/arcade"
import { boothCategoryLabel } from "@/lib/booth-points"
import { isMapsDisabled, PRIZE_DESK_MAP_HREF } from "@/lib/maps"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Riwayat Poin | Insight Arcade",
  description: "Riwayat poin Insight Arcade ITB Insight.",
  robots: { index: false, follow: false },
}

const HREF = "/arcade/history"

// Every time the player's points went up or down (arcade_player_history, migration 0039).
// Reached from the clock icon on /arcade/rewards.
export default async function PointsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${HREF}`)

  const filter = parseHistoryFilter((await searchParams).filter)
  const [events, board] = await Promise.all([
    getPointsHistory(user.id).catch((err): PointsEvent[] | null => {
      console.error("[arcade-history] history failed", err)
      return null
    }),
    getArcadeBoard().catch(() => null),
  ])

  const mine = board?.entries.find((e) => e.userId === user.id)
  const points = mine?.points ?? board?.staff.find((e) => e.userId === user.id)?.points
  const all = events ?? []
  const toCheck = all.filter((e) => matchesFilter(e, "check")).length

  return (
    <QuestPageShell activeTab="rewards" points={points} rank={mine?.rank}>
      <PointsHistoryMobile
        backHref="/arcade/rewards"
        filters={HISTORY_FILTERS.map((f) => ({
          label: f.id === "check" && toCheck > 0 ? `${f.label} ${toCheck}` : f.label,
          href: f.id === "all" ? HREF : `${HREF}?filter=${f.id}`,
          active: f.id === filter,
        }))}
        entries={all.filter((e) => matchesFilter(e, filter)).map((e) => toHistoryEntry(e, wibClock, boothCategoryLabel))}
        empty={
          events === null
            ? "Riwayat belum bisa dimuat. Coba lagi sebentar."
            : all.length === 0
              ? "Belum ada poin. Scan QR profilmu di booth atau selesaikan side quest."
              : "Tidak ada catatan untuk saringan ini."
        }
        reference={historyReference(user.id)}
        referenceNote="Tunjukkan kode ini ke panitia di Booth Entrepreneur (area Food & Beverages) kalau poinmu belum masuk."
        help={isMapsDisabled() ? undefined : { label: "Lokasi", href: PRIZE_DESK_MAP_HREF }}
      />
    </QuestPageShell>
  )
}
