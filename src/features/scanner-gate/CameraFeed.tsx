"use client"

import { useCamera, type CameraStatus } from "./useCamera"
import styles from "./CameraFeed.module.css"

const PESAN: Record<
  Exclude<CameraStatus, "ready">,
  { title: string; hint?: string; retry: boolean }
> = {
  idle: { title: "Menyiapkan kamera…", retry: false },
  requesting: {
    title: "Menunggu izin kamera…",
    hint: "Pilih Izinkan di permintaan yang muncul di browser.",
    retry: false,
  },
  denied: {
    title: "Izin kamera ditolak",
    hint: "Buka pengaturan izin situs di browser, izinkan kamera, lalu coba lagi.",
    retry: true,
  },
  notfound: {
    title: "Kamera tidak ditemukan",
    hint: "Perangkat ini sepertinya tidak punya kamera yang bisa dipakai.",
    retry: true,
  },
  busy: {
    title: "Kamera sedang dipakai",
    hint: "Tutup aplikasi atau tab lain yang memakai kamera, lalu coba lagi.",
    retry: true,
  },
  insecure: {
    title: "Kamera butuh koneksi aman",
    hint: "Browser hanya mengizinkan kamera lewat HTTPS atau localhost.",
    retry: false,
  },
  unsupported: {
    title: "Browser tidak mendukung kamera",
    hint: "Coba buka lewat Chrome atau Safari versi terbaru.",
    retry: false,
  },
  error: { title: "Kamera gagal dinyalakan", retry: true },
}

interface CameraFeedProps {
  onDecode?: (text: string) => void
}

export default function CameraFeed({ onDecode }: CameraFeedProps) {
  const { videoRef, canvasRef, status, retry } = useCamera({ onDecode })

  const pesan = status === "ready" ? null : PESAN[status]

  return (
    <div className={styles.feed}>
      {}
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        muted
        autoPlay
        aria-hidden="true"
      />

      {}
      <canvas ref={canvasRef} hidden />

      {pesan ? (
        <div className={styles.state} role="status">
          <p className={styles.stateTitle}>{pesan.title}</p>
          {pesan.hint ? <p className={styles.stateHint}>{pesan.hint}</p> : null}
          {pesan.retry ? (
            <button type="button" className={styles.retry} onClick={retry}>
              Coba lagi
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
