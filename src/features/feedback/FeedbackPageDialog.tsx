"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import type { FeedbackAccount } from "@/lib/feedback/account"
import type { PublicFeedbackForm } from "@/lib/feedback/forms"
import LogOutModal from "@/shared/components/modals/LogOutModal"
import Modal from "@/shared/components/modals/Modal"
import modalStyles from "@/shared/components/modals/FeedbackModal.module.css"

import FeedbackPanel from "./FeedbackPanel"
import { FEEDBACK_DIALOG_WIDTH } from "./layout"

type Props = {
  /** From the cached page render; replaced by the fresh copy from the API once it loads. */
  form: PublicFeedbackForm
}

type Loaded = { form: PublicFeedbackForm; account: FeedbackAccount | null }
type Envelope = { success: true; data: Loaded } | { success: false }

/**
 * The feedback form as a pop-up on top of the landing page (/feedback/[slug] renders the landing
 * page behind it). Clicking outside the form — or pressing Escape — asks for confirmation; "Ya"
 * leaves for the landing page.
 */
export default function FeedbackPageDialog({ form }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  // The page is cached (ISR), so the signed-in name/email and the live open/closed state come
  // from the API, per visitor. If that request fails, the cached form still works anonymously.
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/feedback/${encodeURIComponent(form.slug)}`, { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json() as Promise<Envelope>)
      .then((json) => setLoaded(json.success ? json.data : { form, account: null }))
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ form, account: null })
      })
    return () => controller.abort()
  }, [form])

  return (
    <>
      {/* Always open; closing it is only possible through the confirmation below. */}
      <Modal open onClose={() => setConfirmOpen(true)} label="Feedback" width={FEEDBACK_DIALOG_WIDTH} radius={20}>
        {loaded ? (
          <FeedbackPanel form={loaded.form} account={loaded.account} />
        ) : (
          <div className={modalStyles.status}>
            <h2 className={modalStyles.title}>{form.title}</h2>
            <p className={modalStyles.message} aria-live="polite">
              Memuat form…
            </p>
          </div>
        )}
      </Modal>

      <LogOutModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => router.push("/")}
        title="Keluar dari form feedback?"
        cancelLabel="Tidak"
        confirmLabel="Ya"
      />
    </>
  )
}
