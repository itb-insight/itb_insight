"use client"

import { useEffect, useRef, useState } from "react"

import { distanceM, type Fix } from "@/lib/geofence"
import {
  BURST_FIXES,
  BURST_GAP_MS,
  inZone,
  OUTSIDE_CHECK_MS,
  PING_INTERVAL_MS,
  type Zone,
} from "@/lib/presence-geo"

import { jakartaToday, readStorage, writeStorage } from "./storage"
import styles from "./OnSite.module.css"

/*
  Opt-in booth presence (D-day). Rules, enforced here and again on the server:
    - nothing runs unless presence is configured and open today (/api/presence/config)
    - nothing is recorded without the user's consent (our card, then the browser prompt)
    - outside the event zone positions are checked locally, every 3 minutes, and never sent
    - inside it, one ping a minute; in the booth zone with burst on, 8 fixes 2 s apart
      (EXPERIMENTAL, see src/lib/presence-geo.ts)
    - leaving the zone stops sending at once and fires the geofence-exit feedback trigger
    - a fix confidently outside the zone (its whole uncertainty circle outside) sends one
      "left the area" signal, no coordinates (POST /api/presence/exit): once when the page first
      finds the phone outside, and again each time it walks out. The /admin/d-day headcount
      assumes a visitor stays in the area for 5 h after their last in-area signal unless this
      arrives.
    - paused while the tab is hidden; browsers give no location then anyway
    - test mode (PRESENCE_TEST_MODE, admin/staff only): runs any day, checks every 30 s outside
      the zone, and shows how far the phone is from it
  No state update per GPS fix: positions live in local variables; the UI changes when the visitor
  enters or leaves the zone and once per ping (booth countdown, admin field-test readout).
*/

type Config =
  | { enabled: false }
  | {
      enabled: true
      open: boolean
      consented: boolean
      promptEligible: boolean
      eventZone: Zone & { maxAccuracyM: number }
      boothZone: Zone | null
      burst: boolean
      debug: boolean
      tester: boolean
    }

type ActiveConfig = Extract<Config, { enabled: true }>

type PingResult = {
  insideVenue: boolean
  booth: { id: string; name: string } | null
  dwellSeconds: number
  visitMinSeconds: number
  fixes: { received: number; used: number; spreadM: number; accuracyM: number } | null
}

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } }

type Stage = "idle" | "explain" | "tracking"

const DISMISSED_KEY = "presence-card-dismissed"
const TESTER_OUTSIDE_CHECK_MS = 30_000

/** Debug readout while outside the event zone (admins and testers only). */
type OutsideReadout = { distanceM: number; accuracyM: number } | { noFix: true }

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 }

function currentFix(): Promise<Fix | null> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude, accuracyM: coords.accuracy }),
      () => resolve(null),
      GEO_OPTIONS,
    )
  })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** "Left the area", no body. Best effort: a lost signal only keeps the visitor in the headcount longer. */
function reportExit() {
  fetch("/api/presence/exit", { method: "POST", keepalive: true }).catch(() => {})
}

/** A function, not an inline check: the tab can be hidden during an await. */
const pageHidden = () => document.visibilityState === "hidden"

async function geolocationPermission(): Promise<PermissionState | "unknown"> {
  try {
    return (await navigator.permissions.query({ name: "geolocation" })).state
  } catch {
    return "unknown" // Safari before 16 has no Permissions API for geolocation
  }
}

/** Pings come once a minute, so the countdown is in whole minutes, rounded up. */
const minutesLeft = (seconds: number) => `± ${Math.max(1, Math.ceil(seconds / 60))} menit lagi`

export default function PresenceTracker({ onVenueExit }: { onVenueExit: () => void }) {
  const [config, setConfig] = useState<ActiveConfig | null>(null)
  const [stage, setStage] = useState<Stage>("idle")
  const [inside, setInside] = useState(false)
  const [readout, setReadout] = useState<PingResult | null>(null)
  const [outside, setOutside] = useState<OutsideReadout | null>(null)
  const [busy, setBusy] = useState(false)

  const exitRef = useRef(onVenueExit)
  useEffect(() => {
    exitRef.current = onVenueExit
  }, [onVenueExit])

  // 1. Is presence on today, and has this user opted in?
  useEffect(() => {
    if (!("geolocation" in navigator)) return
    const controller = new AbortController()

    ;(async () => {
      try {
        const res = await fetch("/api/presence/config", { cache: "no-store", signal: controller.signal })
        const json = (await res.json()) as Envelope<Config>
        if (!json.success || !json.data.enabled || !json.data.open) return
        const active = json.data
        setConfig(active)

        if (active.consented) {
          if ((await geolocationPermission()) !== "denied") setStage("tracking")
        } else if (active.promptEligible && readStorage("local", DISMISSED_KEY) !== jakartaToday()) {
          setStage("explain")
        }
      } catch {
        // offline or aborted: try again on the next page load
      }
    })()

    return () => controller.abort()
  }, [])

  // 2. The loop.
  useEffect(() => {
    if (stage !== "tracking" || !config) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let wasInside = false
    // Sent once per stay outside: reset when a ping confirms the phone is back inside.
    let exitReported = false
    const outsideCheckMs = config.tester ? TESTER_OUTSIDE_CHECK_MS : OUTSIDE_CHECK_MS

    const schedule = (ms: number) => {
      clearTimeout(timer)
      if (!cancelled) timer = setTimeout(tick, ms)
    }

    const leave = () => {
      if (!wasInside) return
      wasInside = false
      setInside(false)
      exitRef.current()
    }

    async function tick() {
      if (cancelled || pageHidden()) return

      const first = await currentFix()
      if (cancelled) return
      if (!first) {
        if (config!.debug) setOutside({ noFix: true })
        return schedule(outsideCheckMs)
      }

      const inEventZone = first.accuracyM <= config!.eventZone.maxAccuracyM && inZone(config!.eventZone, first)
      if (!inEventZone) {
        leave()
        // An imprecise fix that still overlaps the zone proves nothing: only a confident one counts.
        if (!exitReported && !inZone(config!.eventZone, first)) {
          exitReported = true
          reportExit()
        }
        // Distances only, kept in this tab: nothing is sent while outside the zone.
        if (config!.debug) {
          setOutside({ distanceM: Math.round(distanceM(config!.eventZone, first)), accuracyM: Math.round(first.accuracyM) })
        }
        return schedule(outsideCheckMs)
      }
      if (config!.debug) setOutside(null)

      const fixes = [first]
      const started = Date.now()
      if (config!.burst && config!.boothZone && inZone(config!.boothZone, first)) {
        while (fixes.length < BURST_FIXES) {
          await sleep(BURST_GAP_MS)
          if (cancelled || pageHidden()) return
          const next = await currentFix()
          if (next) fixes.push(next)
        }
      }

      try {
        const res = await fetch("/api/presence/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fixes: fixes.map((fix) => ({ lat: fix.lat, lng: fix.lng, accuracy: fix.accuracyM })) }),
        })
        const json = (await res.json()) as Envelope<PingResult>
        if (cancelled) return
        if (!json.success) {
          // Consent withdrawn elsewhere, or the event day is over: stop for this page.
          if (["CONSENT_REQUIRED", "PRESENCE_CLOSED", "PRESENCE_DISABLED"].includes(json.error.code)) {
            leave()
            setStage("idle")
            return
          }
        } else {
          if (json.data.insideVenue) {
            if (!wasInside) setInside(true)
            wasInside = true
            exitReported = false
          } else {
            leave()
          }
          setReadout(json.data)
        }
      } catch {
        // offline: try again next interval
      }

      schedule(Math.max(5_000, PING_INTERVAL_MS - (Date.now() - started)))
    }

    const onVisibility = () => {
      clearTimeout(timer)
      if (!pageHidden()) tick()
    }

    document.addEventListener("visibilitychange", onVisibility)
    tick()

    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [stage, config])

  function dismiss() {
    writeStorage("local", DISMISSED_KEY, jakartaToday())
    setStage("idle")
  }

  async function accept() {
    setBusy(true)
    // Triggers the browser's own permission prompt; consent is stored only once it is granted.
    const fix = await currentFix()
    if (!fix) {
      setBusy(false)
      dismiss()
      return
    }
    try {
      const res = await fetch("/api/presence/consent", { method: "POST" })
      const json = (await res.json()) as Envelope<unknown>
      setStage(json.success ? "tracking" : "idle")
    } catch {
      setStage("idle")
    } finally {
      setBusy(false)
    }
  }

  async function withdraw() {
    setBusy(true)
    try {
      const res = await fetch("/api/presence/consent", { method: "DELETE" })
      const json = (await res.json()) as Envelope<unknown>
      if (json.success) {
        setStage("idle")
        setInside(false)
        setReadout(null)
        setOutside(null)
      }
    } catch {
      // keep tracking; the visitor can try again
    } finally {
      setBusy(false)
    }
  }

  if (stage === "explain") {
    return (
      <aside className={styles.card} aria-labelledby="presence-card-title">
        <h2 id="presence-card-title" className={styles.cardTitle}>
          Catat kunjungan booth-mu?
        </h2>
        <p className={styles.cardText}>
          Selama kamu di area ITB Insight (Kampus ITB Ganesha) dan halaman ini terbuka, lokasi HP-mu
          dipakai untuk mencatat booth yang kamu kunjungi dan berapa lama. Kami hanya menyimpan nama
          booth dan waktunya, bukan koordinatmu. Di luar area acara lokasimu tidak dikirim; yang dicatat
          hanya waktu kamu keluar area. Tidak memengaruhi poin, dan bisa dimatikan kapan saja.{" "}
          <a href="/privacy" className={styles.link}>
            Kebijakan privasi
          </a>
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={accept} disabled={busy}>
            {busy ? "Menunggu izin…" : "Izinkan lokasi"}
          </button>
          <button type="button" className={styles.secondary} onClick={dismiss} disabled={busy}>
            Nanti saja
          </button>
        </div>
      </aside>
    )
  }

  if (stage === "tracking" && !inside && config?.debug && outside) {
    return (
      <aside className={styles.chip} aria-live="polite">
        <span>{config.tester ? "Mode uji: di luar zona acara" : "Di luar zona acara"}</span>
        <button type="button" className={styles.chipButton} onClick={withdraw} disabled={busy}>
          Matikan
        </button>
        <span className={styles.debug}>
          {"noFix" in outside
            ? "lokasi tidak terbaca"
            : `${outside.distanceM} m dari pusat venue (radius ${config.eventZone.radiusM} m) · acc ${outside.accuracyM} m` +
              (outside.accuracyM > config.eventZone.maxAccuracyM ? ` (> ${config.eventZone.maxAccuracyM} m, diabaikan)` : "")}
        </span>
      </aside>
    )
  }

  if (stage === "tracking" && inside) {
    return (
      <aside className={styles.chip} aria-live="polite">
        <span>
          {readout?.booth
            ? readout.dwellSeconds >= readout.visitMinSeconds
              ? `Booth ${readout.booth.name}: tercatat dikunjungi`
              : `Booth ${readout.booth.name}: ${minutesLeft(readout.visitMinSeconds - readout.dwellSeconds)}`
            : "Kunjungan booth sedang dicatat"}
        </span>
        <button type="button" className={styles.chipButton} onClick={withdraw} disabled={busy}>
          Matikan
        </button>
        {config?.debug && readout && (
          <span className={styles.debug}>
            {readout.insideVenue ? "venue" : "outside"} · booth {readout.booth?.name ?? "—"} · dwell{" "}
            {readout.dwellSeconds}s
            {readout.fixes &&
              ` · fixes ${readout.fixes.used}/${readout.fixes.received} · spread ${readout.fixes.spreadM} m · acc ${readout.fixes.accuracyM} m`}
          </span>
        )}
      </aside>
    )
  }

  return null
}
