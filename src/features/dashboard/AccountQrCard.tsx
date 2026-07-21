"use client"

import { QRCodeSVG } from "qrcode.react"

import styles from "./Dashboard.module.css"

type AccountQrCardProps = {
  accountId: string
  email?: string | null
}

// "Account ID" QR shown on the participant dashboard. Booth admins scan it to hand out
// points, and it doubles as the entry pass for the live event. The encoded value is the
// Supabase user id — the same id competition_registrations.user_id references, so a scan
// resolves both the visitor's registrations and the point-assignment target.
// Mirrors the visitor QR from the itb-insight booth demo (reference/itb-insight).
export default function AccountQrCard({ accountId, email }: AccountQrCardProps) {
  return (
    <section className={styles.qrCard}>
      <div className={styles.qrHeader}>
        <span className={`${styles.badge} ${styles.badgeVerified}`}>Account ID</span>
        <h2 className={styles.qrTitle}>Tunjukkan QR ini untuk masuk & poin booth</h2>
        <p className={styles.qrHint}>
          Petugas booth memindai kode ini untuk memberi poin, dan kode yang sama menjadi tiket
          masuk acara langsung.
        </p>
      </div>

      <div className={styles.qrCode}>
        <QRCodeSVG
          value={accountId}
          size={200}
          level="H"
          marginSize={2}
          fgColor="#08090f"
          bgColor="#ffffff"
        />
      </div>

      <div className={styles.qrMeta}>
        {email ? <p className={styles.qrEmail}>{email}</p> : null}
        <p className={styles.qrUid}>
          UID: <span className={styles.mono}>{accountId}</span>
        </p>
      </div>
    </section>
  )
}
