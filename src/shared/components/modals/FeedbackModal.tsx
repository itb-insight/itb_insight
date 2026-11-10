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

export interface FeedbackValue {
  rating: number
  name: string
  email: string
  feedback: string
}

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (value: FeedbackValue) => void
}

export default function FeedbackModal({ open, onClose, onSubmit }: FeedbackModalProps) {
  const [rating, setRating] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState("")

  return (
    <Modal open={open} onClose={onClose} label="Feedback" width={354} radius={20}>
      <form
        className={styles.body}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.({ rating, name, email, feedback })
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
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
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
