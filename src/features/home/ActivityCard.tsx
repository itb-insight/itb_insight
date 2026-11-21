"use client"

import { useState } from "react"
import Image from "next/image"
import { Crown, Plus, Trophy, User } from "lucide-react"

import PilihKegiatanModal from "@/shared/components/modals/PilihKegiatanModal"

import cardStyles from "./HomeCard.module.css"
import styles from "./ActivityCard.module.css"
import type { ActivityEntry, ActivityMember } from "./activityTypes"

interface ActivityCardProps {
  /** null = the activity could not be loaded. */
  entries: ActivityEntry[] | null
  /** Admin preview: no "add activity" control. */
  preview?: boolean
}

const STATE_TAGS: Record<ActivityMember["state"], string | null> = {
  active: null,
  invited: "Diundang",
  unclaimed: "Belum bergabung",
}

export default function ActivityCard({ entries, preview = false }: ActivityCardProps) {
  const [active, setActive] = useState(0)
  const [pilihKegiatanOpen, setPilihKegiatanOpen] = useState(false)

  const list = entries ?? []
  const index = Math.min(active, Math.max(list.length - 1, 0))
  const entry = list[index]
  const others = list.map((item, i) => ({ item, i })).filter(({ i }) => i !== index)

  return (
    <section className={`${cardStyles.surface} ${styles.card}`}>
      <h2 className={styles.cardTitle}>My Activity</h2>

      <div className={styles.tabs}>
        {entry && (
          <div className={styles.tabActive}>
            <Trophy size={24} color="#1B3B7D" aria-hidden="true" />
            <span className={styles.tabActiveLabel}>{entry.competitionName}</span>
          </div>
        )}

        {others.map(({ item, i }) => (
          <button key={item.teamId} type="button" className={styles.tabButton} onClick={() => setActive(i)}>
            <Trophy size={24} aria-hidden="true" />
            <span className={styles.tabButtonLabel}>{item.competitionName}</span>
          </button>
        ))}

        {!preview && (
          <button
            type="button"
            className={styles.tabAdd}
            onClick={() => setPilihKegiatanOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={pilihKegiatanOpen}
            aria-label="Tambah kegiatan"
          >
            <Plus size={24} aria-hidden="true" />
          </button>
        )}
      </div>

      {entry ? (
        <ActivityPanel entry={entry} />
      ) : (
        <div className={`${styles.panel} ${styles.panelEmpty}`}>
          <p className={styles.emptyText}>
            {entries === null
              ? "Aktivitasmu belum bisa dimuat. Coba muat ulang halaman ini."
              : "Kamu belum terdaftar di lomba mana pun. Tim yang mendaftar lewat formulir akan muncul di sini setelah kamu masuk dengan email yang didaftarkan."}
          </p>
        </div>
      )}

      {!preview && (
        <PilihKegiatanModal open={pilihKegiatanOpen} onClose={() => setPilihKegiatanOpen(false)} />
      )}
    </section>
  )
}

function ActivityPanel({ entry }: { entry: ActivityEntry }) {
  return (
    <div className={`${styles.panel} ${entry.withdrawn ? styles.panelWithdrawn : ""}`}>
      <div className={styles.headingRow}>
        <h3 className={styles.competitionName}>{entry.competitionName}</h3>
        <span className={styles.statusChip}>{entry.badge}</span>
        {entry.statusLabel && <span className={`${styles.statusChip} ${styles.statusChipAlert}`}>{entry.statusLabel}</span>}
      </div>

      <p className={styles.teamName}>
        {entry.teamName} <span className={styles.teamUid}>· {entry.teamUid}</span>
      </p>

      <div className={styles.universityRow}>
        <p className={styles.university}>{entry.institution}</p>
      </div>

      <div className={styles.members}>
        {entry.members.map((member) => {
          const tag = STATE_TAGS[member.state]
          return (
            <div
              key={member.id}
              className={`${styles.memberRow} ${member.isLeader ? styles.memberRowLeader : ""}`}
            >
              <span className={styles.memberInfo}>
                {member.isLeader ? (
                  // Figma marks the leader with a gold crown
                  <Crown size={24} color="#FFF236" fill="#FFF236" aria-hidden="true" />
                ) : (
                  <User size={24} color="#1B3B7D" aria-hidden="true" />
                )}
                <span className={styles.memberRole}>{member.role}</span>
                <span className={styles.memberName}>
                  {member.name}
                  {member.isYou && " (Kamu)"}
                </span>
                {tag && <span className={styles.memberTag}>{tag}</span>}
              </span>
            </div>
          )
        })}
      </div>

      {entry.nextStage && (
        <>
          <p className={styles.activityLabel}>Activity</p>
          <div className={styles.submissionRow}>
            <span className={styles.submissionLabel}>{entry.nextStage.label}</span>
            <span className={styles.submissionDate}>{entry.nextStage.date}</span>
          </div>
        </>
      )}

      {entry.actions.length > 0 && (
        <div className={styles.actions}>
          {entry.actions.map((action) => (
            <a
              key={action.href + action.label}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionButton}
            >
              {action.icon && (
                <Image src={action.icon} alt="" width={24} height={24} loading="eager" className={styles.actionIcon} />
              )}
              <span className={styles.actionLabel}>{action.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
