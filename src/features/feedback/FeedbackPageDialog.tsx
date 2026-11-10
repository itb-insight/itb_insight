"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import type { FeedbackAccount } from "@/lib/feedback/account"
import type { PublicFeedbackForm } from "@/lib/feedback/forms"
import LogOutModal from "@/shared/components/modals/LogOutModal"
import Modal from "@/shared/components/modals/Modal"

import FeedbackPanel from "./FeedbackPanel"
import { FEEDBACK_DIALOG_WIDTH } from "./layout"

type Props = {
  form: PublicFeedbackForm
  account: FeedbackAccount | null
}

/**
 * The feedback form as a pop-up on top of the landing page (/feedback/[slug] renders the landing
 * page behind it). Clicking outside the form — or pressing Escape — asks for confirmation; "Ya"
 * leaves for the landing page.
 */
export default function FeedbackPageDialog({ form, account }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      {/* Always open; closing it is only possible through the confirmation below. */}
      <Modal open onClose={() => setConfirmOpen(true)} label="Feedback" width={FEEDBACK_DIALOG_WIDTH} radius={20}>
        <FeedbackPanel form={form} account={account} />
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
