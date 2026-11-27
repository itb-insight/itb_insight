import { publicName } from "../format"
import type { SidequestSubmissionRow } from "../types"
import styles from "./QuestOps.module.css"

interface ReviewQueueProps {
  submissions: SidequestSubmissionRow[]
  disabled: boolean
  onDecide: (id: string, decision: "approved" | "rejected") => void
}

const PLATFORMS: [RegExp, string, string][] = [
  [/(^|\.)instagram\.com$/, "Instagram", "IG"],
  [/(^|\.)tiktok\.com$/, "TikTok", "TT"],
  [/(^|\.)(x|twitter)\.com$/, "X", "X"],
]

function describeProof(url: string | null) {
  if (!url) return { platform: "Tanpa link", short: "-", href: null, display: "-" }
  try {
    const u = new URL(url)
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad protocol")
    const host = u.hostname.replace(/^www\./, "")
    const match = PLATFORMS.find(([re]) => re.test(host))
    return {
      platform: match?.[1] ?? "Link",
      short: match?.[2] ?? "URL",
      href: u.href,
      display: decodeURI(`${host}${u.pathname}`),
    }
  } catch {
    return { platform: "Link tidak valid", short: "!", href: null, display: url }
  }
}

export default function ReviewQueue({ submissions, disabled, onDecide }: ReviewQueueProps) {
  const pending = submissions.filter((s) => s.status === "pending")

  return (
    <section className={styles.panel} aria-labelledby="review-title">
      <h2 id="review-title" className={`${styles.panelTitle} ${styles.panelTitleSmall}`}>
        Social posts <span className={styles.dot} aria-hidden /> review queue
        <span className={styles.muted}>({pending.length})</span>
      </h2>

      {pending.length === 0 ? (
        <p className={styles.muted}>Antrean kosong. Semua post sudah direview.</p>
      ) : (
        <ul className={styles.queue}>
          {pending.map((s) => {
            const proof = describeProof(s.proof_url)
            const name = publicName(s.profiles?.full_name ?? "Pengunjung")
            return (
              <li key={s.id} className={styles.post}>
                <span className={styles.thumb} aria-hidden>
                  {proof.short}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className={styles.postWho}>
                    {name} <span className={styles.dot} aria-hidden /> {proof.platform}
                  </p>
                  {proof.href ? (
                    <a className={styles.postLink} href={proof.href} target="_blank" rel="noopener noreferrer nofollow">
                      {proof.display}
                    </a>
                  ) : (
                    <span className={styles.postLink}>{proof.display}</span>
                  )}
                </div>
                <div className={styles.postActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={disabled}
                    aria-label={`Approve post ${name}`}
                    onClick={() => onDecide(s.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={styles.btn}
                    aria-label={`Reject post ${name}`}
                    onClick={() => onDecide(s.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
