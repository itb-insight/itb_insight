import clsx from "clsx"
import Link from "next/link"

import type { ArcadeSideQuest } from "@/lib/arcade"
import { SOCIAL } from "@/shared/constants/social"

import ProofUploadForm from "./ProofUploadForm"
import styles from "./arcade.module.css"
import quest from "./quest.module.css"

export const STATUS_TEXT: Record<ArcadeSideQuest["status"], string> = {
  todo: "Belum selesai",
  review: "Menunggu verifikasi",
  done: "Selesai",
  rejected: "Ditolak, silakan kirim ulang",
}

const STATUS_CLASS: Record<ArcadeSideQuest["status"], string | undefined> = {
  todo: undefined,
  review: styles.status_review,
  done: styles.status_done,
  rejected: styles.status_rejected,
}

export function SideQuestStatus({ status }: { status: ArcadeSideQuest["status"] }) {
  return <span className={clsx(styles.status, STATUS_CLASS[status])}>{STATUS_TEXT[status]}</span>
}

// Follow quests open the official accounts (the footer's, src/shared/constants/social.ts);
// other quests open their shortcut link.
function questLinks(q: ArcadeSideQuest): Array<{ href: string; label: string }> {
  if (q.needsHandle === "instagram") return [{ href: SOCIAL.instagram.url, label: `Buka Instagram @${SOCIAL.instagram.handle}` }]
  if (q.needsHandle === "tiktok_x") {
    return [
      { href: SOCIAL.tiktok.url, label: `Buka TikTok @${SOCIAL.tiktok.handle}` },
      { href: SOCIAL.x.url, label: `Buka X @${SOCIAL.x.handle}` },
    ]
  }
  if (!q.shortcutUrl) return []
  const instagram = q.shortcutUrl.includes("instagram.com/")
  return [{ href: q.shortcutUrl, label: instagram ? `Buka Instagram @${SOCIAL.instagram.handle}` : "Buka tautan quest" }]
}

// What a player can do on a side quest: open its link, upload the photo proof, or see that re-uploads ran out.
// Used on the quest page (/arcade/[id]) and inline on the area pages (/arcade/area/[category]).
export default function SideQuestActions({
  sideQuest,
  canUpload,
  teams,
}: {
  sideQuest: ArcadeSideQuest
  canUpload: boolean
  teams?: Array<{ id: string; name: string }>
}) {
  const links = questLinks(sideQuest)
  return (
    <>
      {links.length > 0 ? (
        <div className={styles.linkButtons}>
          {links.map((l) => {
            const external = l.href.startsWith("http")
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(quest.lightButton, styles.wideButton)}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {l.label}
                {external ? " ↗" : ""}
              </Link>
            )
          })}
        </div>
      ) : null}
      {canUpload ? <ProofUploadForm quest={sideQuest.slug} kind={sideQuest.proofKind} needsHandle={sideQuest.needsHandle} teams={teams} /> : null}
      {sideQuest.status === "rejected" && !canUpload ? (
        <div className={styles.notice}>
          <p className={styles.noticeText}>Kesempatan kirim ulang sudah habis.</p>
        </div>
      ) : null}
    </>
  )
}
