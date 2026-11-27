import type { ArcadeArea, ArcadeSideQuest } from "@/lib/arcade"

import QuestCard from "./QuestCard"
import { QuestHeader, QuestScreen } from "./QuestShell"
import SideQuestActions, { SideQuestStatus } from "./SideQuestActions"
import styles from "./arcade.module.css"
import quest from "./quest.module.css"

export type AreaSideQuest = { quest: ArcadeSideQuest; canUpload: boolean }

// One area of the main quest (/arcade/area/[category]): its booths and which ones you visited,
// then the area's photo side quests (Add Yours, drone soccer) with the upload form right here.
export default function ArcadeAreaView({
  area,
  sideQuests = [],
  committee,
  teams,
}: {
  area: ArcadeArea
  sideQuests?: AreaSideQuest[]
  committee?: boolean
  teams?: Array<{ id: string; name: string }>
}) {
  return (
    <QuestScreen>
      <div className={quest.body}>
        <QuestHeader title="Main Quest" backHref="/arcade" backLabel="Kembali ke Insight Arcade" />
        <div className={styles.sectionHead}>
          <h2 className={styles.areaTitle}>{area.label}</h2>
          <span className={styles.sectionCount}>
            {area.visited}/{area.total}
          </span>
        </div>
        <p className={styles.sectionHint}>Tunjukkan QR profilmu ke panitia di booth untuk mendapat poin.</p>
        {area.booths.length > 0 ? (
          <div className={styles.cards}>
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
        ) : (
          <p className={styles.empty}>Belum ada booth di area ini.</p>
        )}

        {sideQuests.length > 0 ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Side Quest di area ini</h2>
            </div>
            <p className={styles.sectionHint}>Kirim link atau foto sebagai bukti.</p>
            {sideQuests.map(({ quest: q, canUpload }) => (
              <article key={q.slug} className={styles.sideCard}>
                <div className={styles.sideCardHead}>
                  <h3 className={styles.sideCardTitle}>{q.title}</h3>
                  <span className={quest.cardPoints}>+{q.points}</span>
                </div>
                <SideQuestStatus status={q.status} />
                {q.description ? <p className={styles.sideCardText}>{q.description}</p> : null}
                <SideQuestActions sideQuest={q} canUpload={canUpload} committee={committee} teams={q.needsVote ? teams : undefined} />
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </QuestScreen>
  )
}
