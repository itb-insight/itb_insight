import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import ProofUploadForm from "@/features/quest/ProofUploadForm"
import QuestPageShell from "@/features/quest/QuestPageShell"
import { QuestScreen } from "@/features/quest/QuestShell"
import styles from "@/features/quest/quest.module.css"
import { getArcadePlayer, getDroneTeams } from "@/lib/arcade"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "Side Quest | Insight Arcade", robots: { index: false, follow: false } }

const STATUS_TEXT: Record<string, string> = {
  todo: "Belum selesai",
  review: "Menunggu verifikasi",
  done: "Selesai",
  rejected: "Ditolak, silakan kirim ulang",
}

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

  const external = quest.shortcutUrl?.startsWith("http")
  const canUpload =
    quest.verify === "proof" && !player.committee && (quest.status === "todo" || (quest.status === "rejected" && quest.attempts < 2))
  const teams = canUpload && quest.needsVote ? await getDroneTeams() : undefined

  return (
    <QuestPageShell points={player.points} rank={player.rank}>
      <QuestScreen>
        <div className={styles.body}>
          <Link href="/arcade" className={styles.cardMeta}>
            ← Insight Arcade
          </Link>
          <h1 className={styles.cardTitle}>{quest.title}</h1>
          <p className={styles.cardPoints}>+{quest.points} poin</p>
          <p className={styles.cardMeta}>{quest.description}</p>
          <p className={styles.cardMeta}>Status: {STATUS_TEXT[quest.status]}</p>
          {quest.shortcutUrl ? (
            <Link
              href={quest.shortcutUrl}
              className={styles.card}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className={styles.cardTitle}>Buka tautan quest</span>
            </Link>
          ) : null}
          {canUpload ? <ProofUploadForm quest={quest.slug} needsHandle={quest.needsHandle} teams={teams} /> : null}
          {quest.status === "rejected" && !canUpload ? (
            <p className={styles.cardMeta}>Kesempatan kirim ulang sudah habis.</p>
          ) : null}
        </div>
      </QuestScreen>
    </QuestPageShell>
  )
}
