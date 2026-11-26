"use client"

import jsQR from "jsqr"
import { useEffect, useRef } from "react"

import styles from "./QrCameraScanner.module.css"

type QrCameraScannerProps = {
  onResult: (text: string) => void
  onError: (message: string) => void
}

const MAX_DECODE_WIDTH = 640 // downscale frames before decoding; plenty for a phone-held QR

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : ""
  if (name === "NotAllowedError") return "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser."
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Kamera tidak ditemukan di perangkat ini."
  if (name === "NotReadableError") return "Kamera sedang dipakai aplikasi lain."
  return "Kamera tidak dapat dibuka."
}

// Opens the (rear) camera on mount, decodes frames with jsQR, and reports the first QR found.
// Stops the camera on success and on unmount. Needs a secure context (HTTPS or localhost).
export default function QrCameraScanner({ onResult, onError }: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
  })

  useEffect(() => {
    let stopped = false
    let stream: MediaStream | null = null
    let frame = 0

    const stop = () => {
      stopped = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((track) => track.stop())
    }

    async function start() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        onErrorRef.current("Kamera butuh HTTPS (atau localhost) dan browser yang mendukung.")
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
      } catch (err) {
        if (!stopped) onErrorRef.current(cameraErrorMessage(err))
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d", { willReadFrequently: true })
      if (stopped || !video || !canvas || !ctx) {
        stop()
        return
      }

      video.srcObject = stream
      try {
        await video.play()
      } catch {
        // Autoplay can reject if unmounted mid-start; the stopped check below handles it.
      }

      const tick = () => {
        if (stopped) return
        if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
          const width = Math.min(MAX_DECODE_WIDTH, video.videoWidth)
          const height = Math.round((video.videoHeight * width) / video.videoWidth)
          canvas.width = width
          canvas.height = height
          ctx.drawImage(video, 0, 0, width, height)
          const code = jsQR(ctx.getImageData(0, 0, width, height).data, width, height, {
            inversionAttempts: "dontInvert",
          })
          if (code?.data) {
            stop()
            onResultRef.current(code.data)
            return
          }
        }
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }

    start()
    return stop
  }, [])

  return (
    <div className={styles.viewport}>
      <video ref={videoRef} className={styles.video} playsInline muted aria-label="Kamera pemindai QR" />
      <div className={styles.reticle} aria-hidden="true" />
      <canvas ref={canvasRef} hidden />
    </div>
  )
}
