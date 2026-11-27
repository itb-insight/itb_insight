import Link from "next/link"

import type { ArcadePlayer } from "@/lib/arcade"

import PointsCard from "./PointsCard"
import QuestCard from "./QuestCard"
import { QuestScreen } from "./QuestShell"
import { CollectionCard } from "./SideQuestSection"
import styles from "./quest.module.css"
import type { QuestItem, QuestStatus } from "./types"

/*
  Insight Arcade hub (/arcade) on real data (src/lib/arcade.ts getArcadePlayer):
  points and rank, the staff-scanned areas (main quests), side quests, collections.
*/

const SIDE_STATUS: Record<string, QuestStatus> = { todo: "default", review: "review", done: "done", rejected: "default" }

function sideMeta(verify: string, status: string): string {
  if (status === "done") return "Selesai"
  if (status === "review") return "Menunggu verifikasi"
  if (status === "rejected") return "Ditolak, kirim ulang"
  if (verify === "auto_gate") return "Otomatis saat QR-mu di-scan di gate"
  if (verify === "auto_feedback") return "Otomatis setelah isi formulir (login)"
  if (verify === "auto_referral") return "Segera dibuka"
  return "Upload bukti"
}

export default function ArcadeHub({ player, signedIn }: { player: ArcadePlayer | null; signedIn: boolean }) {
  const top10 = player?.top10Points ?? null
  const target = Math.max(top10 !== null ? top10 + 1 : 1, player?.points ?? 0)
  const stats = {
    points: player?.points ?? 0,
    lifetime: player?.points ?? 0,
    rank: player?.rank ?? 0,
    totalRanked: player?.players ?? 0,
    tierName: player?.rank && player.rank <= 10 ? "Kamu di Top 10!" : "Menuju Top 10 (Mug & Keychain)",
    tierTarget: target,
    tierSegments: { filled: Math.min(10, Math.round(((player?.points ?? 0) / target) * 10)), total: 10 },
  }

  return (
    <QuestScreen>
      <div className={styles.body}>
        <h1 className={styles.cardTitle}>Insight Arcade</h1>
        {!signedIn ? (
          <p className={styles.cardMeta}>
            <Link href="/login?next=/arcade">Login</Link> untuk mulai mengumpulkan poin. Tunjukkan QR profilmu ke panitia di
            tiap booth.
          </p>
        ) : player?.committee ? (
          <p className={styles.cardMeta}>Akun panitia tidak ikut Insight Arcade.</p>
        ) : null}

        {player ? <PointsCard stats={stats} /> : null}

        <p className={styles.cardMeta}>
          Main 06:00–14:50 WIB. Sticker untuk yang sudah menyelesaikan quest (selama stok ada). Top 1–5 dapat Mug, 6–10
          Keychain. Ambil hadiah di Booth Entre dengan menunjukkan QR profilmu.
        </p>

        <h2 className={styles.cardTitle}>Main Quest · scan QR di booth</h2>
        <div className={styles.list}>
          {(player?.areas ?? []).map((area) => {
            const quest: QuestItem = {
              id: area.category,
              title: area.label,
              meta: `${area.visited}/${area.total} dikunjungi`,
              points: area.booths.reduce((sum, b) => sum + b.points, 0),
              status: area.visited === area.total && area.total > 0 ? "done" : "default",
              icon: area.visited === area.total && area.total > 0 ? "check" : "store",
            }
            return <QuestCard key={area.category} quest={quest} href={`/arcade/area/${area.category}`} />
          })}
        </div>

        <h2 className={styles.cardTitle}>Side Quest</h2>
        <div className={styles.list}>
          {(player?.sideQuests ?? []).map((q) => {
            const quest: QuestItem = {
              id: q.slug,
              title: q.title,
              meta: sideMeta(q.verify, q.status),
              points: q.points,
              status: SIDE_STATUS[q.status] ?? "default",
              icon: q.status === "done" ? "check" : q.verify === "proof" ? "camera" : "calendar",
            }
            return <QuestCard key={q.slug} quest={quest} href={`/arcade/${q.slug}`} />
          })}
        </div>

        <h2 className={styles.cardTitle}>Koleksi · bonus otomatis</h2>
        {(player?.collections ?? []).map((c) => (
          <CollectionCard
            key={c.slug}
            collection={{
              id: c.slug,
              title: c.title,
              description: c.description ?? "",
              reward: c.bonus,
              progress: c.progress,
              total: c.total,
              segments: { filled: c.progress, total: c.total },
            }}
          />
        ))}
      </div>
    </QuestScreen>
  )
}
