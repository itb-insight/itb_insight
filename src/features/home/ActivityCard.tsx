"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Crown,
  Pencil,
  Plus,
  SquarePen,
  Trophy,
  User,
} from "lucide-react"

import PilihKegiatanModal from "@/shared/components/modals/PilihKegiatanModal"

import cardStyles from "./HomeCard.module.css"
import styles from "./ActivityCard.module.css"
import { ACTIVITY } from "./activityData"

export default function ActivityCard() {
  const [active, setActive] = useState(0)
  const [pilihKegiatanOpen, setPilihKegiatanOpen] = useState(false)

  const entry = ACTIVITY[active]
  const others = ACTIVITY.map((item, i) => ({ item, i })).filter(({ i }) => i !== active)

  return (
    <section className={`${cardStyles.surface} ${styles.card}`}>
      <h2 className={styles.cardTitle}>My Activity</h2>

      <div className={styles.tabs}>
        <div className={styles.tabActive}>
          <Trophy size={24} color="#1B3B7D" aria-hidden="true" />
          <span className={styles.tabActiveLabel}>{entry.competitionName}</span>
        </div>

        {others.map(({ item, i }) => (
          <button
            key={item.competitionName}
            type="button"
            className={styles.tabButton}
            onClick={() => setActive(i)}
          >
            <Trophy size={24} aria-hidden="true" />
            <span className={styles.tabButtonLabel}>{item.competitionName}</span>
          </button>
        ))}

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
      </div>

      <div className={styles.panel}>
        <div className={styles.headingRow}>
          <h3 className={styles.competitionName}>{entry.competitionName}</h3>
          <span className={styles.statusChip}>{entry.badge}</span>
        </div>

        <p className={styles.teamName}>{entry.teamName}</p>

        <div className={styles.universityRow}>
          <p className={styles.university}>{entry.university}</p>
          <button type="button" className={styles.editData}>
            Edit Data
            <Pencil size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.members}>
          {entry.members.map((member) => (
            <div
              key={`${member.role}-${member.name}`}
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
                <span className={styles.memberName}>{member.name}</span>
              </span>

              {member.isLeader && (
                <button type="button" className={styles.memberEdit} aria-label="Ubah ketua">
                  <SquarePen size={24} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" className={styles.inviteRow}>
          <span className={styles.invitePlus}>+</span>
          <span className={styles.inviteLabel}>Invite Anggota</span>
        </button>

        <p className={styles.activityLabel}>Activity</p>

        <div className={styles.submissionRow}>
          <span className={styles.submissionLabel}>{entry.submissionLabel}</span>
          <span className={styles.submissionDate}>{entry.submissionDate}</span>
        </div>

        <div className={styles.actions}>
          {entry.actions.map((action) => (
            <button key={action.label} type="button" className={styles.actionButton}>
              <Image
                src={action.icon}
                alt=""
                width={24}
                height={24}
                loading="eager"
                className={styles.actionIcon}
              />
              <span className={styles.actionLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <PilihKegiatanModal
        open={pilihKegiatanOpen}
        onClose={() => setPilihKegiatanOpen(false)}
      />
    </section>
  )
}
