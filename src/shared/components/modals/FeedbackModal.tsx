"use client"

import { useId, useState } from "react"

import Modal from "./Modal"
import styles from "./FeedbackModal.module.css"

const STAR_PATH =
  "M23.34 0 L28.84 16.95 L46.67 16.95 L32.25 27.43 L37.76 44.39 " +
  "L23.34 33.91 L8.91 44.39 L14.42 27.43 L0 16.95 L17.83 16.95 Z"

function Star({ filled }: { filled: boolean }) {
  const id = useId()

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      {/*

      */}
      <defs>
        <linearGradient
          id={`${id}-fill`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="44.39"
          x2="0"
          y2="0"
        >
          <stop stopColor="#DEE8FB" />
          <stop offset="1" stopColor="#ACC7FF" />
        </linearGradient>
        <linearGradient
          id={`${id}-stroke`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="44.39"
        >
          <stop stopColor="#DEE8FB" />
          <stop offset="1" stopColor="#ACC7FF" />
        </linearGradient>
      </defs>
      <g transform="translate(4.67 5.83)">
        <path
          d={STAR_PATH}
          fill={filled ? `url(#${id}-fill)` : "none"}
          stroke={filled ? `url(#${id}-stroke)` : "#7FA9F6"}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/** Sesuai kolom `context` di feedback_responses (migrasi 0007). */
export type FeedbackContext = "event" | "booth" | "inspirates"

/**
 * Bentuknya sengaja dibikin sedekat mungkin dengan body POST /api/feedback,
 * supaya waktu disambungkan tinggal diteruskan.
 *
 * Empat yang pertama punya kolom sendiri di feedback_responses. `name` dan
 * `email` TIDAK — tabelnya cuma punya `user_id` ke profiles. Keduanya tetap
 * dikirim lewat callback supaya tidak hilang, tapi pemanggilnya yang memutuskan
 * mau diapakan: dimasukkan ke `metadata` jsonb, dibuatkan kolom lewat migrasi
 * baru, atau dibuang kalau ternyata feedback hanya untuk yang sudah login.
 */
export interface FeedbackValue {
  context: FeedbackContext
  boothId: string | null
  rating: number
  /** null kalau kosong, mengikuti submitFeedback() yang menormalkan "" jadi null. */
  comment: string | null
  name: string
  email: string
}

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  /** Kolom `context` wajib di tabel; default "event" sama seperti POST /api/feedback. */
  context?: FeedbackContext
  /** Diisi kalau context "booth" — misal dari halaman scanner booth. */
  boothId?: string | null
  /** Belum tersambung ke mana-mana — wiring menyusul. */
  onSubmit?: (value: FeedbackValue) => void
}

export default function FeedbackModal({
  open,
  onClose,
  context = "event",
  boothId = null,
  onSubmit,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [comment, setComment] = useState("")

  return (
    <Modal open={open} onClose={onClose} label="Feedback" width={354} radius={20}>
      <form
        className={styles.body}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.({
            context,
            boothId,
            rating,
            comment: comment.trim() || null,
            name: name.trim(),
            email: email.trim(),
          })
        }}
      >
        <h2 className={styles.title}>Feedback</h2>

        <div className={styles.stars} role="radiogroup" aria-label="Beri nilai">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={styles.star}
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} bintang`}
              onClick={() => setRating(value)}
            >
              <Star filled={value <= rating} />
            </button>
          ))}
        </div>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              className={styles.input}
              type="text"
              placeholder="Insert name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              className={styles.input}
              type="email"
              placeholder="Insert email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Feedback (optional)</span>
            <textarea
              className={styles.textarea}
              placeholder="Write down feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
        </div>

        <button type="submit" className={styles.submit}>
          Submit
        </button>
      </form>
    </Modal>
  )
}
