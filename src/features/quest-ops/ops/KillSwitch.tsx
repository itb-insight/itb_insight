import styles from "./QuestOps.module.css"

export type KillState = "off" | "pending" | "on"

interface KillSwitchProps {
  state: KillState
  onRequest: () => void
  onConfirm: () => void
  onCancel: () => void
  onResume: () => void
}

export default function KillSwitch({ state, onRequest, onConfirm, onCancel, onResume }: KillSwitchProps) {
  return (
    <section
      className={`${styles.panel} ${styles.kill} ${state === "on" ? styles.killActive : ""}`}
      aria-labelledby="kill-title"
    >
      <h2 id="kill-title" className={styles.panelTitle}>
        Kill switch
      </h2>

      {state === "on" ? (
        <p className={styles.killText}>
          SEMUA pemberian poin dan penukaran hadiah sedang DIJEDA. Staff memakai log kertas.
        </p>
      ) : (
        <p className={styles.killText}>
          Pauses ALL point grants and redemptions. Staff switch to the paper log. Needs a second organizer to confirm
        </p>
      )}

      {state === "pending" && (
        <p className={styles.killText} role="status">
          Menunggu konfirmasi organizer kedua…
        </p>
      )}

      <div className={styles.actions}>
        {state === "off" && (
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={onRequest}>
            Pause everything
          </button>
        )}
        {state === "pending" && (
          <>
            <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={onConfirm}>
              Konfirmasi (organizer 2)
            </button>
            <button type="button" className={styles.btn} onClick={onCancel}>
              Batal
            </button>
          </>
        )}
        {state === "on" && (
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onResume}>
            Lanjutkan poin
          </button>
        )}
      </div>
    </section>
  )
}
