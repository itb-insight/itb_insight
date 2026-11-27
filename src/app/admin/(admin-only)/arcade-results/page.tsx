import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import PublishResults from "@/features/arcade-ops/PublishResults"
import { arcadeWindow, getArcadeBoard, getArcadeSettings, getResultWinners } from "@/lib/arcade"
import { createServiceClient } from "@/lib/supabase/server"

import styles from "../../booth-access/page.module.css"

export const dynamic = "force-dynamic"
export const metadata = { title: "Hasil Arcade | ITB Insight Admin", robots: { index: false, follow: false } }

// Insight Arcade final results (admins). Publishing: POST /api/arcade/results (0033).
export default async function ArcadeResultsPage() {
  const [board, settings, results] = await Promise.all([getArcadeBoard(), getArcadeSettings(), getResultWinners()])
  const top = board.entries.slice(0, 15)

  const unreviewed = new Map<string, number>()
  if (top.length > 0) {
    const { data } = await createServiceClient()
      .from("sidequest_submissions")
      .select("user_id")
      .eq("source", "proof")
      .eq("review_state", "unreviewed")
      .in("user_id", top.map((e) => e.userId))
    for (const r of (data ?? []) as Array<{ user_id: string }>) unreviewed.set(r.user_id, (unreviewed.get(r.user_id) ?? 0) + 1)
  }

  return (
    <>
      <PageHeader title="Hasil Insight Arcade" subtitle="Umumkan hasil akhir setelah 14:50. Mug untuk peringkat 1–5, Keychain 6–10." />
      <div className={styles.body}>
        <PublishResults
          contenders={top.map((e) => ({ rank: e.rank, userId: e.userId, name: e.name || "Pengunjung", points: e.points, unreviewed: unreviewed.get(e.userId) ?? 0 }))}
          winners={results.winners.map((w) => ({ rank: w.rank, name: w.name, points: w.points, prize: w.prize, claimed: w.claimed }))}
          version={results.version}
          frozen={settings ? arcadeWindow(settings) === "frozen" : false}
        />
      </div>
    </>
  )
}
