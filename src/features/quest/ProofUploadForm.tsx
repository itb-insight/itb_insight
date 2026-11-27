"use client"

import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"

import { createClient } from "@/lib/supabase/client"

import styles from "./quest.module.css"

/*
  Photo proof for an Insight Arcade side quest (POST /api/arcade/proof). The photo is shrunk in the
  browser (longest side 1600 px, JPEG) so uploads stay small on venue mobile data.
*/

async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82))
    return blob ?? file
  } catch {
    return file
  }
}

export default function ProofUploadForm({
  quest,
  needsHandle,
  teams,
}: {
  quest: string
  needsHandle: string | null
  /** Drone soccer: the teams to vote for; undefined = no vote. */
  teams?: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [handle, setHandle] = useState("")
  const [team, setTeam] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return setMessage({ ok: false, text: "Pilih foto bukti dulu." })
    setBusy(true)
    setMessage(null)
    try {
      const { data } = await createClient().auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        router.push(`/login?next=/arcade/${quest}`)
        return
      }
      const body = new FormData()
      body.set("quest", quest)
      body.set("file", await shrink(file), "proof.jpg")
      if (needsHandle) body.set("handle", handle)
      if (teams) body.set("voteTeam", team)
      const res = await fetch("/api/arcade/proof", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body })
      const payload = (await res.json().catch(() => null)) as
        | { success: true; data: { code: string; points: number } }
        | { success: false; error: { message: string } }
        | null
      if (!payload || !payload.success) {
        setMessage({ ok: false, text: payload && !payload.success ? payload.error.message : "Gagal mengirim. Coba lagi." })
        return
      }
      setMessage({
        ok: true,
        text:
          payload.data.code === "PENDING"
            ? "Terkirim. Poin masuk setelah diverifikasi panitia."
            : `Terkirim! +${payload.data.points} poin. Panitia akan memeriksa buktinya.`,
      })
      router.refresh()
    } catch {
      setMessage({ ok: false, text: "Sinyal terputus. Coba lagi." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={styles.list}>
      <label className={styles.cardMeta}>
        Foto bukti (screenshot atau foto)
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={busy} />
      </label>
      {needsHandle ? (
        <label className={styles.cardMeta}>
          Username {needsHandle === "instagram" ? "Instagram" : "TikTok/X"} kamu
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@username"
            autoCapitalize="none"
            autoComplete="off"
            maxLength={41}
            required
            disabled={busy}
          />
        </label>
      ) : null}
      {teams ? (
        <label className={styles.cardMeta}>
          Tim yang kamu dukung
          <select value={team} onChange={(e) => setTeam(e.target.value)} required disabled={busy}>
            <option value="" disabled>
              Pilih tim…
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button type="submit" className={styles.card} disabled={busy}>
        <span className={styles.cardTitle}>{busy ? "Mengirim…" : "Kirim bukti"}</span>
      </button>
      {message ? (
        <p className={styles.cardMeta} role="status">
          {message.text}
        </p>
      ) : null}
    </form>
  )
}
