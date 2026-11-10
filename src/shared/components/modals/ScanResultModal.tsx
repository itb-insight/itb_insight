"use client"

import type { CSSProperties, ReactNode } from "react"

import Modal from "./Modal"
import ModalButton from "./ModalButton"
import styles from "./ScanResultModal.module.css"

function CheckIcon() {
  return (
    <svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.52 11.9 L10.9 15.2 L16.48 6.6"
        stroke="currentColor"
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.16 8.16 L15.84 15.84 M15.84 8.16 L8.16 15.84"
        stroke="currentColor"
        strokeWidth="1.92"
        strokeLinecap="round"
      />
    </svg>
  )
}

type ScanVariant = "success" | "error"

interface ScanResultModalProps {
  open: boolean
  onClose: () => void
  variant: ScanVariant
  title: string
  name: string
  detail: ReactNode
  note: ReactNode
  aside?: ReactNode
  actions: ReactNode
  actionsLayout?: "spread" | "equal" | "full"
  identityGap?: number
  width: number
}

export default function ScanResultModal({
  open,
  onClose,
  variant,
  title,
  name,
  detail,
  note,
  aside,
  actions,
  actionsLayout = "spread",
  identityGap = 2,
  width,
}: ScanResultModalProps) {
  const layoutClass = {
    spread: styles.actionsSpread,
    equal: styles.actionsEqual,
    full: styles.actionsFull,
  }[actionsLayout]

  return (
    <Modal open={open} onClose={onClose} label={title} width={width} radius={20}>
      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.heading}>
            <span
              className={`${styles.badge} ${
                variant === "success" ? styles.badgeSuccess : styles.badgeError
              }`}
            >
              {variant === "success" ? <CheckIcon /> : <CloseIcon />}
            </span>
            <h2 className={styles.title}>{title}</h2>
          </div>

          <div
            className={styles.identity}
            style={{ "--identity-gap": `${identityGap}px` } as CSSProperties}
          >
            <div className={styles.nameRow}>
              <p className={styles.name}>{name}</p>
              {aside}
            </div>
            <p className={styles.detail}>{detail}</p>
          </div>

          <p className={styles.note}>{note}</p>
        </div>

        <div className={`${styles.actions} ${layoutClass}`}>{actions}</div>
      </div>
    </Modal>
  )
}

/* ---- tiga preset --------------------------------------------------------- */

interface CheckedInModalProps {
  open: boolean
  onClose: () => void
  name?: string
  detail?: string
  onManualSearch?: () => void
  onNextScan?: () => void
}

export function CheckedInModal({
  open,
  onClose,
  name = "Tiara",
  detail = "08.53, Gate A",
  onManualSearch,
  onNextScan,
}: CheckedInModalProps) {
  return (
    <ScanResultModal
      open={open}
      onClose={onClose}
      variant="success"
      title="Checked In"
      name={name}
      detail={detail}
      note="Tunjukkan ke visitor cara membuka QR: Profil, lalu QR saya, QR yang sama dipakai di semua booth."
      width={388}
      actionsLayout="spread"
      actions={
        <>
          <ModalButton variant="outline" size="sm" onClick={onManualSearch}>
            Cari Manual
          </ModalButton>
          <ModalButton variant="solid" size="sm" onClick={onNextScan}>
            Scan Berikutnya
          </ModalButton>
        </>
      }
    />
  )
}

interface BelumAbsenModalProps {
  open: boolean
  onClose: () => void
  name?: string
  points?: number
  onCancel?: () => void
  onConfirm?: () => void
}

export function BelumAbsenModal({
  open,
  onClose,
  name = "Bob",
  points = 50,
  onCancel,
  onConfirm,
}: BelumAbsenModalProps) {
  return (
    <ScanResultModal
      open={open}
      onClose={onClose}
      variant="error"
      title="Belum absen di gate"
      name={name}
      detail="User ini belum absen. Konfirmasi ke user sebelum klik OK untuk memberikan poin dan absen."
      note={`OK akan mencatat ${name} hadir sebagai skipped gate dan memberi ${points} points.`}
      width={388}
      actionsLayout="equal"
      actions={
        <>
          <ModalButton variant="outline" size="sm" onClick={onCancel ?? onClose}>
            Batal
          </ModalButton>
          <ModalButton variant="solid" size="sm" onClick={onConfirm}>
            OK
          </ModalButton>
        </>
      }
    />
  )
}

interface PoinDiberikanModalProps {
  open: boolean
  onClose: () => void
  name?: string
  points?: string
  total?: string
  detail?: string
  onNextScan?: () => void
}

/** Figma "pop up poin diberikan" (1823:2117), 379x326. */
export function PoinDiberikanModal({
  open,
  onClose,
  name = "Bob",
  points = "+50",
  total = "total 1.291",
  detail = "Tercatat hadir sebagai skipped gate, 09.30",
  onNextScan,
}: PoinDiberikanModalProps) {
  return (
    <ScanResultModal
      open={open}
      onClose={onClose}
      variant="success"
      title="Points diberikan"
      name={name}
      detail={detail}
      note={`Form feedback booth ini muncul di HP ${name}.`}
      width={379}
      actionsLayout="full"
      identityGap={4}
      aside={
        <span className={styles.pointsBlock}>
          <span className={styles.points}>{points}</span>
          <span className={styles.pointsTotal}>{total}</span>
        </span>
      }
      actions={
        <ModalButton variant="solid" size="sm" onClick={onNextScan}>
          Scan Berikutnya
        </ModalButton>
      }
    />
  )
}
