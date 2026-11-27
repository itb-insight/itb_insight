"use client"

import { useMemo, useState } from "react"

import PanelHifi from "./PanelHifi"
import RatingStarsHifi from "./RatingStarsHifi"
import { KATEGORI, type KategoriFeedback } from "./kategoriFeedback"
import styles from "./FeedbackTableHifi.module.css"

export interface FeedbackRowHifi {
  id: number | string
  kategori: KategoriFeedback
  /** Nama objeknya, mis. "Business Case" atau "1A". */
  objek: string
  /** 0–5. */
  bintang: number
  komentar: string
  nama: string
  /** Sudah siap tampil, mis. "14.10" — widget tidak memformat waktu. */
  waktu: string
}

interface FeedbackTableHifiProps {
  title?: string
  rows: FeedbackRowHifi[]
}

/** Saringan bintang di kanan atas. `null` = semua. */
const SARINGAN: { kunci: string; label: string; cocok: (b: number) => boolean }[] = [
  { kunci: "semua", label: "Semua bintang", cocok: () => true },
  { kunci: "1-2", label: "1-2", cocok: (b) => b <= 2 },
  { kunci: "3", label: "3", cocok: (b) => b === 3 },
  { kunci: "4-5", label: "4-5", cocok: (b) => b >= 4 },
]

/**
 * Semua Feedback — Figma node 1939:3949.
 *
 * Pencarian dan saringannya bekerja di sisi klien pada baris yang dioper; widget
 * ini tidak pernah mengambil data sendiri.
 */
export default function FeedbackTableHifi({
  title = "Semua Feedback",
  rows,
}: FeedbackTableHifiProps) {
  const [cari, setCari] = useState("")
  const [saringan, setSaringan] = useState("semua")

  const terlihat = useMemo(() => {
    const kunci = cari.trim().toLowerCase()
    const cocokBintang = SARINGAN.find((s) => s.kunci === saringan)?.cocok ?? (() => true)

    return rows.filter((r) => {
      if (!cocokBintang(Math.round(r.bintang))) return false
      if (!kunci) return true
      // Sesuai tulisan di kolom carinya: isi feedback ATAU nama.
      return r.komentar.toLowerCase().includes(kunci) || r.nama.toLowerCase().includes(kunci)
    })
  }, [rows, cari, saringan])

  return (
    <PanelHifi
      title={title}
      gap={20}
      action={
        <div className={styles.kendali}>
          <div className={styles.cariWrap}>
            <input
              type="search"
              className={styles.cari}
              placeholder="cari isi feedback atau nama"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              aria-label="Cari isi feedback atau nama"
            />
          </div>

          {SARINGAN.map((s) => (
            <button
              key={s.kunci}
              type="button"
              className={`${styles.pil} ${saringan === s.kunci ? styles.pilAktif : ""}`}
              aria-pressed={saringan === s.kunci}
              onClick={() => setSaringan(s.kunci)}
            >
              {s.label}
            </button>
          ))}
        </div>
      }
    >
      <div className={styles.isi}>
        <div className={styles.gulung}>
          <table className={styles.tabel}>
            <thead>
              <tr>
                <th className={styles.kolomId} scope="col">
                  ID
                </th>
                <th className={styles.kolomObjek} scope="col">
                  Objek
                </th>
                <th className={styles.kolomBintang} scope="col">
                  Bintang
                </th>
                <th scope="col">Komentar</th>
                <th className={styles.kolomNama} scope="col">
                  Nama
                </th>
                <th className={styles.kolomWaktu} scope="col">
                  Waktu
                </th>
              </tr>
            </thead>

            <tbody>
              {terlihat.length === 0 ? (
                <tr>
                  <td className={styles.kosong} colSpan={6}>
                    Tidak ada feedback yang cocok.
                  </td>
                </tr>
              ) : (
                terlihat.map((r) => {
                  const gaya = KATEGORI[r.kategori]
                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>
                        <div className={styles.objek}>
                          <span
                            className={styles.lencana}
                            style={{ background: gaya.bgLencana, color: gaya.warnaLencana }}
                          >
                            {gaya.lencana}
                          </span>
                          <span className={styles.namaObjek}>{r.objek}</span>
                        </div>
                      </td>
                      <td>
                        <RatingStarsHifi value={r.bintang} />
                      </td>
                      <td>
                        <span className={styles.komentar} title={r.komentar}>
                          {r.komentar}
                        </span>
                      </td>
                      <td>{r.nama}</td>
                      <td>{r.waktu}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PanelHifi>
  )
}
