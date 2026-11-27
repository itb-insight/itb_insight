import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import QuestCard from "@/features/quest/QuestCard"
import QuestPageShell from "@/features/quest/QuestPageShell"
import { QuestScreen } from "@/features/quest/QuestShell"
import styles from "@/features/quest/quest.module.css"
import { getArcadePlayer } from "@/lib/arcade"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "Insight Arcade | ITB Insight", robots: { index: false, follow: false } }

// One area of the main quest (Tech-Xhibition, Play-Tech, ...): its booths and which ones you visited.
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

  return (
    <QuestPageShell activeTab="quests" points={player.points} rank={player.rank}>
      <QuestScreen>
        <div className={styles.body}>
          <Link href="/arcade" className={styles.cardMeta}>
            ← Insight Arcade
          </Link>
          <h1 className={styles.cardTitle}>
            {area.label} · {area.visited}/{area.total}
          </h1>
          <p className={styles.cardMeta}>Tunjukkan QR profilmu ke panitia di booth untuk mendapat poin.</p>
          <div className={styles.list}>
            {area.booths.map((booth) => (
              <QuestCard
                key={booth.id}
                href="/arcade/qr"
                quest={{
                  id: booth.id,
                  title: booth.name,
                  meta: booth.visited ? "Sudah dikunjungi" : (booth.location ?? undefined),
                  points: booth.points,
                  status: booth.visited ? "done" : "default",
                  icon: booth.visited ? "check" : "store",
                }}
              />
            ))}
          </div>
        </div>
      </QuestScreen>
    </QuestPageShell>
  )
}
