"use client"

import { CloudOff, RefreshCw, Trash2, Wifi } from "lucide-react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"

import type { useOfflineQueue } from "./useOfflineQueue"
import styles from "./QueueStatus.module.css"

/*
  Connection badge and the offline queue of a staff scanner (booth, gate): what is waiting on this
  phone, what the server refused when it was sent later (to note in the paper log), and a button to
  send now. docs/OFFLINE.md.
*/

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

export default function QueueStatus({ queue }: { queue: ReturnType<typeof useOfflineQueue> }) {
  const { pending, failed, otherAccountPending, syncing, problem, online } = queue

  const badge = syncing
    ? { className: styles.syncing, icon: RefreshCw, text: `Mengirim antrean (${pending.length})…` }
    : online
      ? { className: styles.online, icon: Wifi, text: pending.length ? `Online · ${pending.length} menunggu` : "Online" }
      : { className: styles.offline, icon: CloudOff, text: "Offline · scan disimpan di HP ini" }
  const BadgeIcon = badge.icon

  return (
    <PanelHifi
      title="Koneksi & antrean"
      subtitle="Saat sinyal hilang, scan disimpan di HP ini dan dikirim otomatis begitu sinyal kembali."
    >
      <p className={`${styles.badge} ${badge.className}`} role="status">
        <BadgeIcon size={18} aria-hidden="true" /> {badge.text}
      </p>

      {problem === "auth" ? (
        <p className={styles.warn}>Sesi login berakhir. Login ulang (akun yang sama) supaya antrean bisa dikirim.</p>
      ) : problem === "paused" ? (
        <p className={styles.warn}>Insight Arcade sedang dijeda panitia. Antrean dikirim setelah dibuka lagi.</p>
      ) : null}

      {otherAccountPending > 0 ? (
        <p className={styles.warn}>
          {otherAccountPending} scan dari akun lain masih menunggu di HP ini. Login dengan akun itu untuk mengirimnya.
        </p>
      ) : null}

      {pending.length > 0 ? (
        <>
          <ul className={styles.list} aria-label="Scan yang menunggu dikirim">
            {pending.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <span>{entry.label}</span>
                <span className={styles.muted}>{timeFormat.format(new Date(entry.capturedAt))}</span>
              </li>
            ))}
          </ul>
          <button type="button" className={styles.button} onClick={() => void queue.flushNow()} disabled={syncing}>
            <RefreshCw size={18} aria-hidden="true" /> Kirim sekarang
          </button>
        </>
      ) : null}

      {failed.length > 0 ? (
        <div className={styles.failed}>
          <p className={styles.failedTitle}>Ditolak saat dikirim ({failed.length})</p>
          <p className={styles.muted}>Catat di log kertas bila perlu, lalu hapus dari daftar.</p>
          <ul className={styles.list}>
            {failed.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <span>
                  {entry.label}
                  <span className={styles.reason}>{entry.error?.message ?? "Ditolak server."}</span>
                </span>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => void queue.dismiss(entry.id)}
                  aria-label={`Hapus ${entry.label} dari daftar`}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </PanelHifi>
  )
}
