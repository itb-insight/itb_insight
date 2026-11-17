"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./ScrollVideoBackground.module.css"

/*
 * Fallback for the (not yet shipped) Blender model: a pre-rendered "one take"
 * video fixed behind the whole landing page. Spec: public/itb-model/ITB-MODEL.md
 *
 *   Section 1   0:00 – 0:13   Countdown, "ITB Insight" explanation, stats   → loops
 *   Trans 1→2   0:13 – 0:15                                                → scrubbed by scroll
 *   Section 2   0:15 – 0:28   Gallery through timeline                     → loops
 *   Trans 2→3   0:28 – 0:29                                                → scrubbed by scroll
 *   Section 3   0:29 – 0:44   Partners and below                           → loops
 *
 * While the viewport is inside a section's scroll range, that section's segment
 * plays at normal speed and loops. Inside a transition's scroll range, playback
 * pauses and the transition segment follows the scroll position (both directions).
 *
 * Both videos (16:9 and 9:16) share these timestamps. They are re-encodes of the
 * originals in public/itb-model/fallback/ with a keyframe every 10 frames, which
 * is what makes seeking smooth.
 */

const SOURCES = {
  landscape: { webm: "/itb-model/fallback/scrub-16x9.webm", mp4: "/itb-model/fallback/scrub-16x9.mp4" },
  portrait: { webm: "/itb-model/fallback/scrub-9x16.webm", mp4: "/itb-model/fallback/scrub-9x16.mp4" },
} as const

/** Viewports narrower than square get the 9:16 video. */
const PORTRAIT_QUERY = "(max-aspect-ratio: 1/1)"

/** Looping video segments, [start, end] in seconds. Section i sits between transitions i-1 and i. */
const SECTIONS: [number, number][] = [
  [0, 13],
  [15, 28],
  [29, 44],
]

/**
 * A scroll position: reached when the top of `selector` sits at `viewport` × the
 * viewport height from the top of the screen (1 = just entering at the bottom,
 * 0 = touching the top).
 */
type ScrollPoint = { selector: string; viewport: number }

/**
 * TUNE HERE. Each transition plays its `time` segment while the page scrolls
 * from `from` to `to`. Everything before the first / between / after the last
 * transition is a looping section.
 */
const TRANSITIONS: { from: ScrollPoint; to: ScrollPoint; time: [number, number] }[] = [
  {
    // Transition 1→2 plays while the gallery scrolls up into place.
    from: { selector: "#gallery", viewport: 1 },
    to: { selector: "#gallery", viewport: 0.25 },
    time: [13, 15],
  },
  {
    // Transition 2→3 plays while the partners scroll up into place.
    from: { selector: "#sponsors", viewport: 1 },
    to: { selector: "#sponsors", viewport: 0.25 },
    time: [28, 29],
  },
]

/** 0–1. Fraction of the gap to the scroll-driven time covered each frame in a transition; lower = floatier. */
const SMOOTHING = 0.18

/**
 * Entering a section with the video up to this many seconds before the section's
 * start (e.g. scrolled out of a transition before it finished) plays forward into
 * it at normal speed instead of cutting to the start.
 */
const LEAD_IN = 3

type ResolvedTransition = { from: number; to: number; time: [number, number] }
type Region =
  | { kind: "section"; index: number }
  | { kind: "transition"; progress: number; time: [number, number] }

function resolveScroll(point: ScrollPoint): number | null {
  const el = document.querySelector(point.selector)
  if (!el) return null
  return el.getBoundingClientRect().top + window.scrollY - point.viewport * window.innerHeight
}

function resolveTransitions(): ResolvedTransition[] | null {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const clamp = (v: number) => Math.min(Math.max(v, 0), maxScroll)
  const out: ResolvedTransition[] = []
  let floor = 0
  for (const t of TRANSITIONS) {
    const from = resolveScroll(t.from)
    const to = resolveScroll(t.to)
    if (from === null || to === null) return null
    // Keep everything in page order even if a short viewport squeezes points together.
    const a = Math.max(clamp(from), floor)
    const b = Math.max(clamp(to), a)
    out.push({ from: a, to: b, time: t.time })
    floor = b
  }
  return out
}

function regionFor(transitions: ResolvedTransition[], scroll: number): Region {
  for (let i = 0; i < transitions.length; i++) {
    const t = transitions[i]
    if (scroll < t.from) return { kind: "section", index: i }
    if (scroll <= t.to) {
      const span = t.to - t.from
      return { kind: "transition", progress: span > 0 ? (scroll - t.from) / span : 1, time: t.time }
    }
  }
  return { kind: "section", index: transitions.length }
}

function pickSource(orientation: keyof typeof SOURCES): string {
  const probe = document.createElement("video")
  const src = SOURCES[orientation]
  return probe.canPlayType('video/webm; codecs="vp9"') ? src.webm : src.mp4
}

/**
 * Drives `--landing-bg-fade` (0 → 1) on <html> while the hero (countdown) scrolls
 * past. LandingPage.module.css uses it to fade the background from
 * `--landing-bg-opacity-countdown` to `--landing-bg-opacity`.
 */
const FADE_START = 0.5 // fraction of the hero's pinned scroll where the fade starts
const FADE_END = 1 // …and where it is complete

function useCountdownBackgroundFade() {
  useEffect(() => {
    const root = document.documentElement
    let frame = 0
    const update = () => {
      frame = 0
      const hero = document.getElementById("hero")
      if (!hero) return
      const pinned = Math.max(1, hero.getBoundingClientRect().height - window.innerHeight)
      const p = window.scrollY / pinned
      const fade = Math.min(Math.max((p - FADE_START) / (FADE_END - FADE_START), 0), 1)
      root.style.setProperty("--landing-bg-fade", fade.toFixed(3))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      root.style.removeProperty("--landing-bg-fade")
    }
  }, [])
}

export default function ScrollVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [orientation, setOrientation] = useState<keyof typeof SOURCES | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  // The src whose first frame has decoded; `ready` flips back to false when src changes.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const ready = src !== null && loadedSrc === src

  useCountdownBackgroundFade()

  // Choose 16:9 vs 9:16 from the viewport shape (client-only, so first render matches SSR).
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (conn?.saveData) return // Respect data saver: keep the plain background.

    const mql = window.matchMedia(PORTRAIT_QUERY)
    const update = () => setOrientation(mql.matches ? "portrait" : "landscape")
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  // Download the whole file up front: seeking a fully-buffered blob avoids a network
  // round-trip per seek (notably on Safari). Falls back to streaming the URL.
  useEffect(() => {
    if (!orientation) return
    const url = pickSource(orientation)
    const controller = new AbortController()
    let objectUrl: string | null = null

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        console.warn("ScrollVideoBackground: blob preload failed, streaming instead", err)
        setSrc(url)
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [orientation])

  // Loop sections / scrub transitions.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src || !ready) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let transitions = resolveTransitions()
    let shown = video.currentTime
    let mode: Region["kind"] | null = null
    let playPending = false
    let frame = 0

    const remap = () => { transitions = resolveTransitions() }
    // Section heights shift as images/fonts load, so re-resolve on any layout change.
    const ro = new ResizeObserver(remap)
    ro.observe(document.body)
    window.addEventListener("resize", remap)

    const play = () => {
      if (playPending) return
      playPending = true
      // Can reject (e.g. iOS Low Power Mode blocks autoplay); the section then shows a still frame.
      video.play().catch(() => {}).finally(() => { playPending = false })
    }

    const tick = () => {
      frame = requestAnimationFrame(tick)
      if (!transitions) { remap(); return }
      const region = regionFor(transitions, window.scrollY)

      if (region.kind === "transition") {
        if (!video.paused) video.pause()
        if (mode !== "transition") shown = video.currentTime
        const [start, end] = region.time
        const target = start + region.progress * (end - start)
        shown += (target - shown) * SMOOTHING
        if (Math.abs(target - shown) < 0.001) shown = target
        // Skip while a seek is in flight so requests don't pile up and lag behind.
        if (!video.seeking && Math.abs(video.currentTime - shown) > 1 / 48) {
          video.currentTime = shown
        }
      } else {
        const [start, end] = SECTIONS[region.index]
        const t = video.currentTime
        const leadIn = reducedMotion.matches ? 0 : LEAD_IN
        // Wrap at the loop point, or jump in if we arrived from somewhere unrelated.
        if (!video.seeking && (t >= end || t < start - leadIn)) {
          video.currentTime = start
        }
        if (reducedMotion.matches) {
          if (!video.paused) video.pause()
        } else if (video.paused) {
          play()
        }
      }
      mode = region.kind
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener("resize", remap)
      video.pause()
    }
  }, [src, ready])

  if (!src) return null

  return (
    <div className={styles.wrapper} aria-hidden="true">
      <video
        ref={videoRef}
        key={src}
        className={`${styles.video} ${ready ? styles.ready : ""}`}
        src={src}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        onLoadedData={() => setLoadedSrc(src)}
      />
    </div>
  )
}
