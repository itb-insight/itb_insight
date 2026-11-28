import clsx from "clsx"
import Link from "next/link"
import type { ReactNode } from "react"

import type { ArcadePlayer } from "@/lib/arcade"
import { isMapsDisabled, PRIZE_DESK_MAP_HREF } from "@/lib/maps"

import PointsCard from "./PointsCard"
import QuestCard from "./QuestCard"
import { QuestHeader, QuestScreen } from "./QuestShell"
import { CollectionCard } from "./SideQuestSection"
import styles from "./arcade.module.css"
import quest from "./quest.module.css"
import type { QuestItem, QuestStatus } from "./types"

/*
  Insight Arcade hub (/arcade) on real data (src/lib/arcade.ts getArcadePlayer):
  points and rank, the staff-scanned areas (main quests), side quests, collections.
*/

const SIDE_STATUS: Record<string, QuestStatus> = { todo: "default", review: "review", done: "done", rejected: "default" }

function sideMeta(verify: string, status: string, proofKind: string): string {
  if (status === "done") return "Selesai"
  if (status === "review") return "Menunggu verifikasi"
  if (status === "rejected") return "Ditolak, kirim ulang"
  if (verify === "auto_gate") return "Otomatis saat QR-mu di-scan di gate"
  if (verify === "auto_feedback") return "Otomatis setelah isi formulir (login)"
  if (verify === "auto_referral") return "Segera dibuka"
  return proofKind === "link" ? "Kirim link bukti" : "Upload foto bukti"
}

function Section({
  title,
  count,
  hint,
  empty,
  children,
}: {
  title: string
  count?: string
  hint?: string
  empty: string
  children: ReactNode[]
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {count ? <span className={styles.sectionCount}>{count}</span> : null}
      </div>
      {hint ? <p className={styles.sectionHint}>{hint}</p> : null}
      {children.length > 0 ? <div className={styles.cards}>{children}</div> : <p className={styles.empty}>{empty}</p>}
    </section>
  )
}

export default function ArcadeHub({ player, signedIn }: { player: ArcadePlayer | null; signedIn: boolean }) {
  const top10 = player?.top10Points ?? null
  const target = Math.max(top10 !== null ? top10 + 1 : 1, player?.points ?? 0)
  const stats = {
    points: player?.points ?? 0,
    lifetime: player?.points ?? 0,
    rank: player?.rank ?? 0,
    totalRanked: player?.players ?? 0,
    tierName: player?.committee
      ? "Akun panitia · tidak masuk peringkat"
      : player?.rank && player.rank <= 10
        ? "Kamu di Top 10!"
        : "Menuju Top 10 (Mug & Keychain)",
    tierTarget: target,
    tierSegments: { filled: Math.min(10, Math.round(((player?.points ?? 0) / target) * 10)), total: 10 },
  }

  const areas = player?.areas ?? []
  const areasDone = areas.filter((a) => a.total > 0 && a.visited === a.total).length
  const sideQuests = player?.sideQuests ?? []
  const sideDone = sideQuests.filter((q) => q.status === "done").length
  const collections = player?.collections ?? []

  return (
    <QuestScreen>
      <div className={quest.body}>
        <QuestHeader title="Insight Arcade" showHome />

        {!signedIn ? (
          <section className={styles.notice}>
            <h2 className={styles.noticeTitle}>Ayo main!</h2>
            <p className={styles.noticeText}>
              Login untuk mulai mengumpulkan poin. Tunjukkan QR profilmu ke panitia di tiap booth.
            </p>
            <Link href="/login?next=/arcade" className={clsx(quest.lightButton, styles.noticeAction)}>
              Login
            </Link>
          </section>
        ) : null}

        {player ? <PointsCard stats={stats} /> : null}

        {player?.committee ? (
          <section className={styles.notice}>
            <h2 className={styles.noticeTitle}>Mode uji coba panitia</h2>
            <p className={styles.noticeText}>
              Kamu login dengan akun panitia. Kamu bisa mencoba semua quest dan poinmu tetap dihitung, tapi kamu tidak
              masuk leaderboard dan tidak bisa mendapat hadiah.
            </p>
          </section>
        ) : null}

        <section className={styles.notice}>
          <h2 className={styles.noticeTitle}>Aturan main</h2>
          <ul className={styles.noticeList}>
            <li>
              Main <strong>06:00–14:50 WIB</strong>.
            </li>
            <li>Sticker untuk yang sudah menyelesaikan quest (selama stok ada).</li>
            <li>
              Top 1–5 dapat <strong>Mug</strong>, Top 6–10 dapat <strong>Keychain</strong>.
            </li>
            <li>
              Ambil hadiah di{" "}
              {isMapsDisabled() ? (
                <strong>Booth Entrepreneur (di Food & Beverages)</strong>
              ) : (
                <Link href={PRIZE_DESK_MAP_HREF} className={styles.noticeLink}>
                  <strong>Booth Entrepreneur (di Food & Beverages)</strong>
                </Link>
              )}{" "}
              dengan menunjukkan QR profilmu. Sticker kapan saja, Mug &amp; Keychain setelah hasil diumumkan.
            </li>
          </ul>
        </section>

        {player ? (
          <>
            <Section
              title="Main Quest"
              count={`${areasDone}/${areas.length}`}
              hint="Scan QR profilmu di booth"
              empty="Belum ada area yang dibuka."
            >
              {areas.map((area) => {
                const done = area.total > 0 && area.visited === area.total
                const item: QuestItem = {
                  id: area.category,
                  title: area.label,
                  meta: `${area.visited}/${area.total} booth dikunjungi`,
                  points: area.booths.reduce((sum, b) => sum + b.points, 0),
                  status: done ? "done" : "default",
                  icon: done ? "check" : "store",
                }
                return <QuestCard key={area.category} quest={item} href={`/arcade/area/${area.category}`} />
              })}
            </Section>

            <Section title="Side Quest" count={`${sideDone}/${sideQuests.length}`} empty="Belum ada side quest.">
              {sideQuests.map((q) => {
                const item: QuestItem = {
                  id: q.slug,
                  title: q.title,
                  meta: sideMeta(q.verify, q.status, q.proofKind),
                  points: q.points,
                  status: SIDE_STATUS[q.status] ?? "default",
                  icon: q.status === "done" ? "check" : q.verify !== "proof" ? "calendar" : q.proofKind === "link" ? "link" : "camera",
                }
                return <QuestCard key={q.slug} quest={item} href={`/arcade/${q.slug}`} />
              })}
            </Section>

            <Section title="Koleksi" hint="Bonus otomatis saat koleksi lengkap" empty="Belum ada koleksi.">
              {collections.map((c) => (
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
            </Section>
          </>
        ) : null}
      </div>
    </QuestScreen>
  )
}
