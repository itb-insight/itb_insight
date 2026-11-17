"use client"

import PersonalQr from "@/shared/components/PersonalQr/PersonalQr"

import styles from "./Dashboard.module.css"

type AccountQrCardProps = {
  accountId: string
  email?: string | null
  /** visitor_tickets.qr_code; null when the ticket could not be issued. */
  qrToken: string | null
}

// "Account ID" QR shown on the participant dashboard. Booth staff scan it to hand out
// points, and gate staff scan it at entry. It encodes the visitor ticket token (see
// src/lib/qr.ts), which maps to the account through visitor_tickets.user_id — never the
// raw user id, which is not secret and cannot be revoked.
export default function AccountQrCard({ accountId, email, qrToken }: AccountQrCardProps) {
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
        {qrToken ? <PersonalQr token={qrToken} size={200} /> : <p className={styles.qrHint}>QR belum tersedia.</p>}
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
