"use client"

import { Check } from "lucide-react"

import Modal from "./Modal"
import ModalButton from "./ModalButton"
import styles from "./RegistrasiBerhasilModal.module.css"

interface RegistrasiBerhasilModalProps {
  open: boolean
  onClose: () => void
  title?: string
  buttonLabel?: string
}

export default function RegistrasiBerhasilModal({
  open,
  onClose,
  title = "Registrasi Berhasil!",
  buttonLabel = "Kembali",
}: RegistrasiBerhasilModalProps) {
  return (
    <Modal open={open} onClose={onClose} label={title} width={450} radius={20} minHeight={500}>
      <div className={styles.body}>
        <div className={styles.badge}>
          {}
          <Check size={128} strokeWidth={3} aria-hidden="true" />
        </div>

        <h2 className={styles.title}>{title}</h2>

        <ModalButton className={styles.button} onClick={onClose}>
          {buttonLabel}
        </ModalButton>
      </div>
    </Modal>
  )
}
