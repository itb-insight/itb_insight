"use client"

import Image from "next/image"

import Modal from "./Modal"
import ModalButton from "./ModalButton"
import styles from "./LogOutModal.module.css"

interface LogOutModalProps {
  open: boolean
  /** Dismiss — also fires on Escape and on a backdrop click. */
  onClose: () => void
  /** The destructive choice. */
  onConfirm?: () => void
  title?: string
}

export default function LogOutModal({
  open,
  onClose,
  onConfirm,
  title = "Keluar Akun?",
}: LogOutModalProps) {
  return (
    <Modal open={open} onClose={onClose} label={title} width={450} radius={12} minHeight={500}>
      <div className={styles.body}>
        <Image
          className={styles.icon}
          src="/images/icons/log-out.svg"
          alt=""
          width={170}
          height={170}
          loading="eager"
        />

        <h2 className={styles.title}>{title}</h2>

        <div className={styles.buttons}>
          <ModalButton className={styles.button} onClick={onClose}>
            Kembali
          </ModalButton>
          <ModalButton className={styles.button} variant="outline" onClick={onConfirm}>
            Keluar
          </ModalButton>
        </div>
      </div>
    </Modal>
  )
}
