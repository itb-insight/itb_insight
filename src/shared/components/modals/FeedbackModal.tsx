"use client"

import { useEffect, useState } from "react"

import FeedbackPanel from "@/features/feedback/FeedbackPanel"
import { FEEDBACK_DIALOG_WIDTH } from "@/features/feedback/layout"
import type { FeedbackAccount } from "@/lib/feedback/account"
import type { PublicFeedbackForm } from "@/lib/feedback/forms"

import Modal from "./Modal"
import styles from "./FeedbackModal.module.css"

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  /** Slug of a row in feedback_forms, e.g. "inspirates-2026". */
  slug: string
}

type Loaded = { form: PublicFeedbackForm; account: FeedbackAccount | null }

type LoadResult = { slug: string; data: Loaded; error: null } | { slug: string; data: null; error: string }

type Envelope = { success: true; data: Loaded } | { success: false; error: { message: string } }

/**
 * Feedback pop-up. Loads the form definition (and the signed-in user's name/email)
 * the first time it opens, then renders the same FeedbackPanel as /feedback/[slug].
 */
export default function FeedbackModal({ open, onClose, slug }: FeedbackModalProps) {
  const [result, setResult] = useState<LoadResult | null>(null)

  const current = result?.slug === slug ? result : null

  useEffect(() => {
    if (!open || current) return

    const controller = new AbortController()
    fetch(`/api/feedback/${encodeURIComponent(slug)}`, { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json() as Promise<Envelope>)
      .then((json) =>
        setResult(
          json.success
            ? { slug, data: json.data, error: null }
            : { slug, data: null, error: json.error.message },
        ),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ slug, data: null, error: "Koneksi bermasalah. Periksa internetmu lalu coba lagi." })
        }
      })
    return () => controller.abort()
  }, [open, slug, current])

  return (
    <Modal open={open} onClose={onClose} label="Feedback" width={FEEDBACK_DIALOG_WIDTH} radius={20}>
      {current?.data ? (
        <FeedbackPanel form={current.data.form} account={current.data.account} onClose={onClose} />
      ) : (
        <div className={styles.status}>
          <h2 className={styles.title}>Feedback</h2>
          {current?.error ? (
            <>
              <p className={styles.message} role="alert">
                {current.error}
              </p>
              <button
                type="button"
                className={styles.retry}
                onClick={() => setResult(null)}
              >
                Coba lagi
              </button>
            </>
          ) : (
            <p className={styles.message} aria-live="polite">
              Memuat form…
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
