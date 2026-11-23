"use client"

import { useState } from "react"

import ScannerGatePage from "@/features/scanner-gate/ScannerGatePage"
import FeedbackModal from "@/shared/components/modals/FeedbackModal"
import {
  BelumAbsenModal,
  CheckedInModal,
  PoinDiberikanModal,
} from "@/shared/components/modals/ScanResultModal"
import styles from "./GatePreview.module.css"

type Which = "feedback" | "checkedIn" | "belumAbsen" | "poin" | null

const TRIGGERS: { id: Exclude<Which, null>; label: string }[] = [
  { id: "checkedIn", label: "Checked In" },
  { id: "belumAbsen", label: "Belum absen" },
  { id: "poin", label: "Points diberikan" },
  { id: "feedback", label: "Feedback" },
]

export default function GatePreview() {
  const [open, setOpen] = useState<Which>(null)
  // Sementara: menampilkan isi QR mentah, supaya pembacaannya bisa dicek
  // sebelum disambungkan ke API dan modal.
  const [terbaca, setTerbaca] = useState<string | null>(null)
  const close = () => setOpen(null)

  return (
    <>
      <ScannerGatePage onDecode={setTerbaca} />

      {terbaca ? (
        <p className={styles.hasil}>
          QR terbaca: <code>{terbaca}</code>
        </p>
      ) : null}

      <div className={styles.triggers}>
        {TRIGGERS.map((t) => (
          <button key={t.id} type="button" className={styles.trigger} onClick={() => setOpen(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <CheckedInModal open={open === "checkedIn"} onClose={close} onNextScan={close} />
      <BelumAbsenModal open={open === "belumAbsen"} onClose={close} onConfirm={close} />
      <PoinDiberikanModal open={open === "poin"} onClose={close} onNextScan={close} />
      <FeedbackModal open={open === "feedback"} onClose={close} slug="inspirates-2026" />
    </>
  )
}
