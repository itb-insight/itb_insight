"use client"

import { X } from "lucide-react"

import Modal from "./Modal"
import ModalButton from "./ModalButton"
import styles from "./PilihKegiatanModal.module.css"

export interface KegiatanChoice {
  heading: string
  description: string
  buttonLabel: string
  onSelect?: () => void
}

interface PilihKegiatanModalProps {
  open: boolean
  onClose: () => void
  title?: string
  choices?: KegiatanChoice[]
}

const PLACEHOLDER =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In vehicula a turpis nec porttitor."

const DEFAULT_CHOICES: KegiatanChoice[] = [
  { heading: "Competition", description: PLACEHOLDER, buttonLabel: "Daftar Lomba" },
  { heading: "Event", description: PLACEHOLDER, buttonLabel: "Daftar Event" },
]

export default function PilihKegiatanModal({
  open,
  onClose,
  title = "Pilih Kegiatan",
  choices = DEFAULT_CHOICES,
}: PilihKegiatanModalProps) {
  return (
    <Modal open={open} onClose={onClose} label={title} width={800} radius={16} minHeight={400}>
      <div className={styles.body}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Tutup">
            <X size={31} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.choices}>
          {choices.map((choice) => (
            <section key={choice.heading} className={styles.choice}>
              <div className={styles.choiceText}>
                <h3 className={styles.choiceHeading}>{choice.heading}</h3>
                <p className={styles.choiceDescription}>{choice.description}</p>
              </div>

              <ModalButton className={styles.choiceButton} onClick={choice.onSelect}>
                {choice.buttonLabel}
              </ModalButton>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  )
}
