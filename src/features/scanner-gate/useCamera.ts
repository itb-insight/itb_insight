"use client"

import jsQR from "jsqr"
import { useCallback, useEffect, useRef, useState } from "react"

export type CameraStatus =
  | "idle"
  | "requesting"
  | "ready"
  /** Petugas menolak, atau izinnya sudah diblokir sebelumnya. */
  | "denied"
  /** Perangkatnya memang tidak punya kamera. */
  | "notfound"
  /** Kamera dipegang aplikasi/tab lain. */
  | "busy"
  /** Bukan HTTPS dan bukan localhost — browser menyembunyikan mediaDevices. */
  | "insecure"
  | "unsupported"
  | "error"

interface UseCameraOptions {
  autoStart?: boolean
  onDecode?: (text: string) => void
}

const MAX_DECODE_WIDTH = 640

const DECODE_INTERVAL_MS = 100

export function useCamera({ autoStart = true, onDecode }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>("idle")

  const onDecodeRef = useRef(onDecode)
  useEffect(() => {
    onDecodeRef.current = onDecode
  }, [onDecode])

  const scanningRef = useRef(true)

  const stop = useCallback(() => {

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    const video = videoRef.current
    if (video) {
      video.srcObject = null
    }
  }, [])

  const start = useCallback(async () => {

    if (streamRef.current) return

    if (typeof window === "undefined") return

    if (!window.isSecureContext) {
      setStatus("insecure")
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported")
      return
    }

    setStatus("requesting")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream

      await videoRef.current.play().catch(() => {})

      setStatus("ready")
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ""

      if (name === "NotAllowedError" || name === "SecurityError") setStatus("denied")
      else if (name === "NotFoundError" || name === "OverconstrainedError") setStatus("notfound")
      else if (name === "NotReadableError" || name === "AbortError") setStatus("busy")
      else setStatus("error")
    }
  }, [])

  useEffect(() => {
    if (!autoStart) return stop

    let alive = true
    void Promise.resolve().then(() => {
      if (alive) void start()
    })

    return () => {
      alive = false
      stop()
    }
  }, [autoStart, start, stop])

  useEffect(() => {
    if (status !== "ready" || !onDecodeRef.current) return

    let frame = 0
    let berhenti = false
    let berikutnya = 0

    const tick = (waktu: number) => {
      if (berhenti) return
      frame = requestAnimationFrame(tick)

      if (!scanningRef.current || waktu < berikutnya) return
      berikutnya = waktu + DECODE_INTERVAL_MS

      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      if (video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth) return

      const width = Math.min(MAX_DECODE_WIDTH, video.videoWidth)
      const height = Math.round((video.videoHeight * width) / video.videoWidth)
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(video, 0, 0, width, height)
      const code = jsQR(ctx.getImageData(0, 0, width, height).data, width, height, {
        inversionAttempts: "dontInvert",
      })

      if (code?.data) {
        scanningRef.current = false
        onDecodeRef.current?.(code.data)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => {
      berhenti = true
      cancelAnimationFrame(frame)
    }
  }, [status])

  const resume = useCallback(() => {
    scanningRef.current = true
  }, [])

  const retry = useCallback(() => {
    stop()
    setStatus("idle")
    scanningRef.current = true
    void start()
  }, [start, stop])

  return { videoRef, canvasRef, status, start, stop, retry, resume }
}
