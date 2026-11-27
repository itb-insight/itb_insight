import type { ArcadeSideQuest } from "@/lib/arcade"

import { QuestHeader, QuestScreen } from "./QuestShell"
import SideQuestActions, { SideQuestStatus } from "./SideQuestActions"
import styles from "./arcade.module.css"
import quest from "./quest.module.css"

// A side quest (/arcade/[id]): points, description, status, shortcut link and the proof form.
export default function SideQuestView({
  sideQuest,
  canUpload,
  committee,
  teams,
}: {
  sideQuest: ArcadeSideQuest
  canUpload: boolean
  committee?: boolean
  teams?: Array<{ id: string; name: string }>
}) {
  return (
    <QuestScreen>
      <div className={quest.body}>
        <QuestHeader title="Side Quest" backHref="/arcade" backLabel="Kembali ke Insight Arcade" />
        <p className={quest.detailPoints}>
          <span className={quest.detailPointsValue}>+{sideQuest.points}</span>
          <span className={quest.detailPointsUnit}>poin</span>
        </p>
        <h2 className={styles.detailTitle}>{sideQuest.title}</h2>
        <SideQuestStatus status={sideQuest.status} />
        {sideQuest.description ? <p className={styles.description}>{sideQuest.description}</p> : null}
        <SideQuestActions sideQuest={sideQuest} canUpload={canUpload} committee={committee} teams={teams} />
      </div>
    </QuestScreen>
  )
}
