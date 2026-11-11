"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"

import type { FeedbackAccount } from "@/lib/feedback/account"
import type { PublicFeedbackForm } from "@/lib/feedback/forms"
import {
  countWords,
  LONG_MAX_CHARS,
  LONG_MAX_WORDS,
  NAME_MAX_CHARS,
  SHORT_MAX_CHARS,
  STARS_MAX,
  type AnswerValue,
  type Answers,
  type Question,
} from "@/lib/feedback/schema"
import ModalButton from "@/shared/components/modals/ModalButton"

import styles from "./FeedbackPanel.module.css"
import Turnstile from "./Turnstile"

type Props = {
  form: PublicFeedbackForm
  /** Signed-in user: name/email are shown read-only; the server takes them from the profile anyway. */
  account: FeedbackAccount | null
  /** In a modal: the finish button closes it. On the page: it links home. */
  onClose?: () => void
}

type Status = "idle" | "submitting" | "done"

type ApiResult =
  | { success: true }
  | { success: false; error: { code: string; message: string; fields?: Record<string, string> | null } }

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null

/**
 * The hi-fi feedback form, driven by a form definition from feedback_forms.
 * Used by FeedbackModal (in-app pop-up) and by the /feedback/[slug] page (QR codes).
 */
export default function FeedbackPanel({ form, account, onClose }: Props) {
  const [answers, setAnswers] = useState<Answers>({})
  const [name, setName] = useState(account?.name ?? "")
  const [email, setEmail] = useState(account?.email ?? "")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("") // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [doneMessage, setDoneMessage] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileReset, setTurnstileReset] = useState(0)
  const renderedAt = useRef(0)
  const idPrefix = useId()

  useEffect(() => {
    renderedAt.current = Date.now()
  }, [])

  if (form.state !== "open") {
    return (
      <Finished
        title="Feedback"
        message={
          form.state === "not_open"
            ? "Form feedback ini belum dibuka. Coba lagi setelah kegiatan dimulai, ya!"
            : "Form feedback ini sudah ditutup. Terima kasih atas partisipasimu!"
        }
        onClose={onClose}
      />
    )
  }

  if (status === "done") {
    return <Finished title="Terima kasih!" message={doneMessage} onClose={onClose} />
  }

  // The overall star rating leads the form, as in the design; everything else keeps its order.
  const hero =
    form.questions.find((q) => q.type === "stars" && q.overall) ?? form.questions.find((q) => q.type === "stars")
  const rest = form.questions.filter((q) => q !== hero)

  const clearError = (key: string) => setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev))

  const setAnswer = (id: string, value: AnswerValue | undefined) => {
    setAnswers((prev) => {
      const next = { ...prev }
      if (value === undefined) delete next[id]
      else next[id] = value
      return next
    })
    clearError(id)
  }

  // Mirrors the server's checks for the common mistakes, so most people never wait on a round trip.
  const validateLocally = () => {
    const found: Record<string, string> = {}
    if (!account) {
      if (!name.trim()) found.name = "Nama wajib diisi."
      if (!email.trim()) found.email = "Email wajib diisi."
    }
    for (const q of form.questions) {
      const value = answers[q.id]
      if (q.required && (value === undefined || value === "")) found[q.id] = "Wajib diisi."
      if (q.type === "long" && typeof value === "string" && countWords(value) > LONG_MAX_WORDS) {
        found[q.id] = `Maksimal ${LONG_MAX_WORDS} kata.`
      }
    }
    if (!consent) found.consent = "Wajib dicentang."
    return found
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError("")

    const local = validateLocally()
    if (Object.keys(local).length > 0) {
      setErrors(local)
      setFormError("Periksa kembali isian yang ditandai.")
      return
    }

    setStatus("submitting")
    setErrors({})

    try {
      const res = await fetch(`/api/feedback/${form.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: account ? "" : name,
          email: account ? "" : email,
          answers,
          consent,
          website,
          elapsedMs: Date.now() - renderedAt.current,
          turnstileToken: turnstileToken || undefined,
        }),
      })
      const result = (await res.json()) as ApiResult

      if (result.success) {
        setDoneMessage("Feedback-mu sudah kami terima. Sampai jumpa di ITB Insight 2026!")
        setStatus("done")
        return
      }

      if (result.error.code === "ALREADY_SUBMITTED") {
        setDoneMessage(result.error.message)
        setStatus("done")
        return
      }

      setErrors(result.error.fields ?? {})
      setFormError(result.error.message)
      // Turnstile tokens are single-use once the server has checked one.
      if (result.error.code === "CAPTCHA_FAILED" || !result.error.fields) setTurnstileReset((n) => n + 1)
      setStatus("idle")
    } catch {
      setFormError("Koneksi bermasalah. Periksa internetmu lalu coba lagi.")
      setTurnstileReset((n) => n + 1)
      setStatus("idle")
    }
  }

  const waitingForTurnstile = Boolean(TURNSTILE_SITE_KEY) && !turnstileToken
  const fieldId = (key: string) => `${idPrefix}-${key}`

  return (
    <form className={styles.body} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.title}>Feedback</h2>
      <p className={styles.subtitle}>{form.description || form.title}</p>

      {hero ? (
        <QuestionField
          question={hero}
          inputId={fieldId(hero.id)}
          value={answers[hero.id]}
          error={errors[hero.id]}
          onChange={(v) => setAnswer(hero.id, v)}
        />
      ) : null}

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId("name")}>
            Name
          </label>
          <input
            id={fieldId("name")}
            className={styles.input}
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Insert name..."
            maxLength={NAME_MAX_CHARS}
            value={name}
            readOnly={Boolean(account)}
            onChange={(e) => {
              setName(e.target.value)
              clearError("name")
            }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${fieldId("name")}-error` : undefined}
          />
          <FieldError id={`${fieldId("name")}-error`} message={errors.name} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId("email")}>
            Email
          </label>
          <input
            id={fieldId("email")}
            className={styles.input}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Insert email address..."
            maxLength={254}
            value={email}
            readOnly={Boolean(account)}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError("email")
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${fieldId("email")}-error` : undefined}
          />
          <FieldError id={`${fieldId("email")}-error`} message={errors.email} />
        </div>
        {account ? (
          <p className={styles.hint}>Terisi dari akunmu.</p>
        ) : (
          <p className={styles.hint}>
            Punya akun?{" "}
            <Link href={`/login?next=${encodeURIComponent(`/feedback/${form.slug}`)}`} className={styles.hintLink}>
              Log in
            </Link>{" "}
            supaya nama dan email terisi otomatis.
          </p>
        )}

        {rest.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            inputId={fieldId(q.id)}
            value={answers[q.id]}
            error={errors[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
          />
        ))}
      </div>

      {/* Honeypot: hidden from people and assistive tech, attractive to form-filling bots. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={fieldId("website")}>Website</label>
        <input
          id={fieldId("website")}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className={styles.consent}>
        <label className={styles.consentLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked)
              clearError("consent")
            }}
            aria-invalid={Boolean(errors.consent)}
          />
          <span>
            Saya setuju nama dan email saya disimpan panitia ITB Insight 2026 hanya untuk evaluasi kegiatan
            ini, dihapus paling lambat {form.piiRetentionDays} hari setelah form ditutup, dan tidak dibagikan
            ke pihak lain.
          </span>
        </label>
        <p className={styles.hint}>
          Jangan menulis data pribadi lain (nomor HP, alamat) di isian. Jika kamu di bawah 18 tahun, pastikan
          orang tua/wali atau gurumu mengetahuinya.
        </p>
        <FieldError id={fieldId("consent-error")} message={errors.consent} />
      </div>

      {TURNSTILE_SITE_KEY ? (
        <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} resetKey={turnstileReset} />
      ) : null}

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={status === "submitting" || waitingForTurnstile}>
        {status === "submitting" ? "Mengirim…" : waitingForTurnstile ? "Memverifikasi…" : "Submit"}
      </button>
    </form>
  )
}

// ─── Question inputs ─────────────────────────────────────────────────────────

function QuestionField({
  question: q,
  inputId,
  value,
  error,
  onChange,
}: {
  question: Question
  inputId: string
  value: AnswerValue | undefined
  error?: string
  onChange: (value: AnswerValue | undefined) => void
}) {
  const labelId = `${inputId}-label`
  const errorId = `${inputId}-error`
  const label = (
    <>
      {q.label}
      {q.required ? null : " (optional)"}
    </>
  )

  if (q.type === "short" || q.type === "long") {
    const text = typeof value === "string" ? value : ""
    const words = countWords(text)
    const overLimit = q.type === "long" && words > LONG_MAX_WORDS
    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        {q.help ? <p className={styles.hint}>{q.help}</p> : null}
        {q.type === "long" ? (
          <textarea
            id={inputId}
            className={styles.textarea}
            placeholder="Write down feedback..."
            maxLength={LONG_MAX_CHARS}
            value={text}
            onChange={(e) => onChange(e.target.value || undefined)}
            aria-invalid={Boolean(error) || overLimit}
            aria-describedby={error ? errorId : undefined}
          />
        ) : (
          <input
            id={inputId}
            className={styles.input}
            placeholder="Write down answer..."
            maxLength={SHORT_MAX_CHARS}
            value={text}
            onChange={(e) => onChange(e.target.value || undefined)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        )}
        {q.type === "long" && words > 0 ? (
          <p className={overLimit ? styles.counterOver : styles.counter}>
            {words} / {LONG_MAX_WORDS} kata
          </p>
        ) : null}
        <FieldError id={errorId} message={error} />
      </div>
    )
  }

  // Clicking the selected option of an optional question clears it.
  const pick = (next: AnswerValue) => onChange(!q.required && value === next ? undefined : next)

  if (q.type === "stars") {
    const rating = typeof value === "number" ? value : 0
    return (
      <div className={styles.field}>
        <span id={labelId} className={`${styles.label} ${styles.centered}`}>
          {label}
        </span>
        <div
          className={styles.stars}
          role="radiogroup"
          aria-labelledby={labelId}
          aria-describedby={error ? errorId : undefined}
        >
          {range(1, STARS_MAX).map((n) => (
            <button
              key={n}
              type="button"
              className={styles.star}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} bintang`}
              onClick={() => pick(n)}
            >
              <Star filled={n <= rating} />
            </button>
          ))}
        </div>
        <FieldError id={errorId} message={error} centered />
      </div>
    )
  }

  // choice and scale: one ModalButton per option, solid when selected.
  const options =
    q.type === "choice"
      ? q.options.map((o) => ({ value: o.value as AnswerValue, label: o.label }))
      : range(q.min, q.max).map((n) => ({ value: n as AnswerValue, label: String(n) }))

  return (
    <div className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {q.help ? <p className={styles.hint}>{q.help}</p> : null}
      <div
        className={q.type === "scale" ? styles.optionRow : styles.optionList}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map((o) => {
          const selected = value === o.value
          return (
            <ModalButton
              key={String(o.value)}
              size="sm"
              variant={selected ? "solid" : "outline"}
              className={q.type === "scale" ? styles.scaleOption : styles.option}
              role="radio"
              aria-checked={selected}
              onClick={() => pick(o.value)}
            >
              {o.label}
            </ModalButton>
          )
        })}
      </div>
      {q.type === "scale" && (q.minLabel || q.maxLabel) ? (
        <div className={styles.scaleLabels} aria-hidden="true">
          <span>{q.minLabel}</span>
          <span>{q.maxLabel}</span>
        </div>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  )
}

// ─── Small pieces ────────────────────────────────────────────────────────────

const STAR_PATH =
  "M23.34 0 L28.84 16.95 L46.67 16.95 L32.25 27.43 L37.76 44.39 " +
  "L23.34 33.91 L8.91 44.39 L14.42 27.43 L0 16.95 L17.83 16.95 Z"

function Star({ filled }: { filled: boolean }) {
  const id = useId()

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} gradientUnits="userSpaceOnUse" x1="0" y1="44.39" x2="0" y2="0">
          <stop stopColor="#DEE8FB" />
          <stop offset="1" stopColor="#ACC7FF" />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="44.39">
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

function Finished({ title, message, onClose }: { title: string; message: string; onClose?: () => void }) {
  return (
    <div className={styles.body}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {onClose ? (
        <button type="button" className={styles.submit} onClick={onClose}>
          Tutup
        </button>
      ) : (
        <Link href="/" className={styles.submit}>
          Ke Beranda
        </Link>
      )}
    </div>
  )
}

function FieldError({ id, message, centered }: { id: string; message?: string; centered?: boolean }) {
  if (!message) return null
  return (
    <p id={id} className={`${styles.fieldError} ${centered ? styles.centered : ""}`} role="alert">
      {message}
    </p>
  )
}

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}
