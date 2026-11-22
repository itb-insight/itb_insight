"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"

import Modal from "./Modal"
import ModalButton from "./ModalButton"
import styles from "./PilihKegiatanModal.module.css"

export interface KegiatanChoice {
  heading: string
  description: string
  buttonLabel: string
  /** Page the button opens (the modal closes first). */
  href?: string
  onSelect?: () => void
}

interface PilihKegiatanModalProps {
  open: boolean
  onClose: () => void
  title?: string
  choices?: KegiatanChoice[]
}

const DEFAULT_CHOICES: KegiatanChoice[] = [
  {
    heading: "Competition",
    description: "Lihat semua lomba ITB Insight 2026, detail tiap lomba, dan tautan pendaftarannya selagi dibuka.",
    buttonLabel: "Lihat Lomba",
    href: "/dashboard/compe-list",
  },
  {
    heading: "Event",
    description: "Lihat rangkaian acara ITB Insight 2026, jadwal dan lokasinya, lalu daftar untuk hadir.",
    buttonLabel: "Lihat Event",
    href: "/dashboard/event-list",
  },
]

export default function PilihKegiatanModal({
  open,
  onClose,
  title = "Pilih Kegiatan",
  choices = DEFAULT_CHOICES,
}: PilihKegiatanModalProps) {
  const router = useRouter()

  const select = (choice: KegiatanChoice) => {
    choice.onSelect?.()
    if (choice.href) {
      onClose()
      router.push(choice.href)
    }
  }

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

              <ModalButton className={styles.choiceButton} onClick={() => select(choice)}>
                {choice.buttonLabel}
              </ModalButton>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  )
}
