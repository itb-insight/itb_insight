"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"

import { readStorage, writeStorage } from "./storage"
import styles from "./OnSite.module.css"

// The form itself (and Turnstile) loads only when the visitor chooses to fill it in.
const FeedbackModal = dynamic(() => import("@/shared/components/modals/FeedbackModal"), { ssr: false })

/*
  Feedback triggers from docs/FEEDBACK.md, in-app (push notifications wait for the PWA):
    - time: when a form the visitor attended opens (feedback_forms.opens_at), while a page is open
    - geofence exit: when PresenceTracker sees the visitor leave the event zone
  /api/feedback/pending decides who is asked (gate check-in, not yet submitted). Each form is
  offered at most once per trigger on this device.
*/

type Pending = { slug: string; title: string }
type PendingResponse = { pending: Pending[]; nextCheckAt: string | null }
type Envelope = { success: true; data: PendingResponse } | { success: false }

type Trigger = "time" | "exit"

const CACHE_KEY = "feedback-pending"
const CACHE_MS = 5 * 60_000
/** Timers longer than this are re-armed on a later page load instead. */
const MAX_WAIT_MS = 12 * 60 * 60_000

const promptedKey = (trigger: Trigger, slug: string) => `feedback-prompted:${trigger}:${slug}`

async function loadPending(fresh: boolean): Promise<PendingResponse | null> {
  if (!fresh) {
    const cached = readStorage("session", CACHE_KEY)
    if (cached) {
      try {
        const { at, data } = JSON.parse(cached) as { at: number; data: PendingResponse }
        if (Date.now() - at < CACHE_MS) return data
      } catch {
        // fall through to the network
      }
    }
  }
  try {
    const res = await fetch("/api/feedback/pending", { cache: "no-store" })
    const json = (await res.json()) as Envelope
    if (!json.success) return null
    writeStorage("session", CACHE_KEY, JSON.stringify({ at: Date.now(), data: json.data }))
    return json.data
  } catch {
    return null
  }
}

export default function FeedbackPrompts({ venueExits }: { venueExits: number }) {
  const [prompt, setPrompt] = useState<Pending | null>(null)
  const [open, setOpen] = useState(false)

  const offer = useCallback((trigger: Trigger, pending: Pending[]) => {
    const next = pending.find((form) => readStorage("local", promptedKey(trigger, form.slug)) === null)
    if (!next) return
    writeStorage("local", promptedKey(trigger, next.slug), new Date().toISOString())
    setPrompt(next)
  }, [])

  // Time trigger: check on load, then again when the next form opens.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const check = async (fresh: boolean) => {
      const data = await loadPending(fresh)
      if (cancelled || !data) return
      offer("time", data.pending)
      if (data.nextCheckAt) {
        const wait = new Date(data.nextCheckAt).getTime() - Date.now() + 5_000
        if (wait > 0 && wait < MAX_WAIT_MS) timer = setTimeout(() => check(true), wait)
      }
    }

    check(false)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [offer])

  // Geofence-exit trigger.
  useEffect(() => {
    if (venueExits === 0) return
    let cancelled = false
    loadPending(true).then((data) => {
      if (!cancelled && data) offer("exit", data.pending)
    })
    return () => {
      cancelled = true
    }
  }, [venueExits, offer])

  return (
    <>
      {prompt && !open && (
        <aside className={`${styles.card} ${styles.stacked}`} aria-labelledby="feedback-prompt-title">
          <h2 id="feedback-prompt-title" className={styles.cardTitle}>
            Gimana acaranya?
          </h2>
          <p className={styles.cardText}>Isi feedback singkat untuk {prompt.title}. Cuma beberapa menit.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => setOpen(true)}>
              Isi feedback
            </button>
            <button type="button" className={styles.secondary} onClick={() => setPrompt(null)}>
              Nanti
            </button>
          </div>
        </aside>
      )}
      {prompt && open && (
        <FeedbackModal
          open
          slug={prompt.slug}
          onClose={() => {
            setOpen(false)
            setPrompt(null)
          }}
        />
      )}
    </>
  )
}
