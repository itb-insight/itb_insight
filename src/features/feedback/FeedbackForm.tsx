"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

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

import styles from "./FeedbackForm.module.css"
import Turnstile from "./Turnstile"

export type FeedbackAccount = { name: string; email: string }

type Props = {
  form: PublicFeedbackForm
  account: FeedbackAccount | null
  prefill: Answers
  turnstileSiteKey: string | null
}

type Status = "idle" | "submitting" | "done"

type ApiResult =
  | { success: true }
  | { success: false; error: { code: string; message: string; fields?: Record<string, string> | null } }

export default function FeedbackForm({ form, account, prefill, turnstileSiteKey }: Props) {
  const [answers, setAnswers] = useState<Answers>(prefill)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("") // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [doneMessage, setDoneMessage] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileReset, setTurnstileReset] = useState(0)
  const renderedAt = useRef(0)

  useEffect(() => {
    renderedAt.current = Date.now()
  }, [])

  if (form.state !== "open") {
    return (
      <Shell title={form.title}>
        <p className={styles.notice}>
          {form.state === "not_open"
            ? "Form feedback ini belum dibuka. Coba lagi setelah kegiatan dimulai, ya!"
            : "Form feedback ini sudah ditutup. Terima kasih atas partisipasimu!"}
        </p>
        <BackHome />
      </Shell>
    )
  }

  if (status === "done") {
    return (
      <Shell title="Terima kasih!">
        <p className={styles.notice}>{doneMessage}</p>
        <BackHome />
      </Shell>
    )
  }

  const setAnswer = (id: string, value: AnswerValue | undefined) => {
    setAnswers((prev) => {
      const next = { ...prev }
      if (value === undefined) delete next[id]
      else next[id] = value
      return next
    })
    setErrors((prev) => ({ ...prev, [id]: "" }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("submitting")
    setFormError("")
    setErrors({})

    try {
      const res = await fetch(`/api/feedback/${form.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
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
      setTurnstileReset((n) => n + 1)
      setStatus("idle")
    } catch {
      setFormError("Koneksi bermasalah. Periksa internetmu lalu coba lagi.")
      setTurnstileReset((n) => n + 1)
      setStatus("idle")
    }
  }

  const waitingForTurnstile = Boolean(turnstileSiteKey) && !turnstileToken

  return (
    <Shell title={form.title} description={form.description}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Data diri</legend>
          {account ? (
            <p className={styles.signedIn}>
              Mengisi sebagai <strong>{account.name || account.email}</strong>
              {account.name ? ` (${account.email})` : null}
            </p>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="fb-name">
                  Nama <Required />
                </label>
                <input
                  id="fb-name"
                  className={styles.input}
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={NAME_MAX_CHARS}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "fb-name-error" : undefined}
                />
                <FieldError id="fb-name-error" message={errors.name} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="fb-email">
                  Email <Required />
                </label>
                <input
                  id="fb-email"
                  className={styles.input}
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "fb-email-error" : undefined}
                />
                <FieldError id="fb-email-error" message={errors.email} />
              </div>
            </>
          )}
        </fieldset>

        {form.questions.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            value={answers[q.id]}
            error={errors[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
          />
        ))}

        {/* Honeypot: hidden from people and assistive tech, attractive to form-filling bots. */}
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="fb-website">Website</label>
          <input
            id="fb-website"
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
              required
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                setErrors((prev) => ({ ...prev, consent: "" }))
              }}
            />
            <span>
              Saya setuju nama dan email saya disimpan oleh panitia ITB Insight 2026 hanya untuk evaluasi
              kegiatan ini. Data diri dihapus paling lambat {form.piiRetentionDays} hari setelah form ditutup
              dan tidak dibagikan ke pihak lain. <Required />
            </span>
          </label>
          <p className={styles.hint}>
            Jangan menulis data pribadi lain (nomor HP, alamat) di kolom isian. Jika kamu berusia di bawah 18
            tahun, pastikan orang tua/wali atau gurumu mengetahui kamu mengisi form ini.
          </p>
          <FieldError id="fb-consent-error" message={errors.consent} />
        </div>

        {turnstileSiteKey ? (
          <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} resetKey={turnstileReset} />
        ) : null}

        {formError ? (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          className={styles.submit}
          disabled={status === "submitting" || waitingForTurnstile}
        >
          {status === "submitting" ? "Mengirim…" : waitingForTurnstile ? "Memverifikasi…" : "Kirim Feedback"}
        </button>
      </form>
    </Shell>
  )
}

// ─── Question inputs ─────────────────────────────────────────────────────────

function QuestionField({
  question: q,
  value,
  error,
  onChange,
}: {
  question: Question
  value: AnswerValue | undefined
  error?: string
  onChange: (value: AnswerValue | undefined) => void
}) {
  const inputId = `fb-q-${q.id}`
  const errorId = `${inputId}-error`
  const describedBy = error ? errorId : undefined

  if (q.type === "short" || q.type === "long") {
    const text = typeof value === "string" ? value : ""
    const counter =
      q.type === "long"
        ? `${countWords(text)} / ${LONG_MAX_WORDS} kata`
        : `${text.length} / ${SHORT_MAX_CHARS} karakter`
    const overLimit = q.type === "long" && countWords(text) > LONG_MAX_WORDS
    return (
      <div className={styles.section}>
        <label className={styles.sectionTitle} htmlFor={inputId}>
          {q.label} {q.required ? <Required /> : <Optional />}
        </label>
        {q.help ? <p className={styles.hint}>{q.help}</p> : null}
        {q.type === "long" ? (
          <textarea
            id={inputId}
            className={styles.textarea}
            rows={5}
            maxLength={LONG_MAX_CHARS}
            required={q.required}
            value={text}
            onChange={(e) => onChange(e.target.value || undefined)}
            aria-invalid={Boolean(error) || overLimit}
            aria-describedby={describedBy}
          />
        ) : (
          <input
            id={inputId}
            className={styles.input}
            maxLength={SHORT_MAX_CHARS}
            required={q.required}
            value={text}
            onChange={(e) => onChange(e.target.value || undefined)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
        )}
        <p className={overLimit ? styles.counterOver : styles.counter}>{counter}</p>
        <FieldError id={errorId} message={error} />
      </div>
    )
  }

  // stars, scale and choice are radio groups
  const options =
    q.type === "choice"
      ? q.options.map((o) => ({ value: o.value as AnswerValue, label: o.label }))
      : range(q.type === "stars" ? 1 : q.min, q.type === "stars" ? STARS_MAX : q.max).map((n) => ({
          value: n as AnswerValue,
          label: q.type === "stars" ? `${n} bintang` : String(n),
        }))

  const groupClass =
    q.type === "stars" ? styles.stars : q.type === "scale" ? styles.scale : styles.choices

  return (
    <fieldset className={styles.section} aria-describedby={describedBy}>
      <legend className={styles.sectionTitle}>
        {q.label} {q.required ? <Required /> : <Optional />}
      </legend>
      {q.help ? <p className={styles.hint}>{q.help}</p> : null}
      <div className={groupClass}>
        {options.map((o) => {
          const checked = value === o.value
          const filled = q.type === "stars" && typeof value === "number" && (o.value as number) <= value
          return (
            <label
              key={String(o.value)}
              className={[
                q.type === "stars" ? styles.star : q.type === "scale" ? styles.scaleItem : styles.choice,
                checked ? styles.checked : "",
                filled ? styles.filled : "",
              ].join(" ")}
            >
              <input
                type="radio"
                className={styles.radio}
                name={q.id}
                value={String(o.value)}
                checked={checked}
                required={q.required}
                onChange={() => onChange(o.value)}
              />
              {q.type === "stars" ? (
                <>
                  <span aria-hidden="true">★</span>
                  <span className={styles.srOnly}>{o.label}</span>
                </>
              ) : (
                <span>{o.label}</span>
              )}
            </label>
          )
        })}
      </div>
      {q.type === "scale" && (q.minLabel || q.maxLabel) ? (
        <div className={styles.scaleLabels} aria-hidden="true">
          <span>{q.minLabel}</span>
          <span>{q.maxLabel}</span>
        </div>
      ) : null}
      {!q.required && value !== undefined ? (
        <button type="button" className={styles.clear} onClick={() => onChange(undefined)}>
          Hapus pilihan
        </button>
      ) : null}
      <FieldError id={errorId} message={error} />
    </fieldset>
  )
}

// ─── Small pieces ────────────────────────────────────────────────────────────

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

function Shell({ title, description, children }: { title: string; description?: string | null; children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>ITB Insight 2026</p>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
        {children}
      </div>
    </main>
  )
}

function BackHome() {
  return (
    <Link href="/" className={styles.submit}>
      Ke Beranda
    </Link>
  )
}

function Required() {
  return (
    <span className={styles.required} aria-label="wajib">
      *
    </span>
  )
}

function Optional() {
  return <span className={styles.optional}>(opsional)</span>
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className={styles.fieldError} role="alert">
      {message}
    </p>
  )
}
