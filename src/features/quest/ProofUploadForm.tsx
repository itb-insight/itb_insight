"use client"

import clsx from "clsx"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"

import { PROOF_LINK_MAX, parseProofLink } from "@/lib/proof-link"
import { createClient } from "@/lib/supabase/client"

import styles from "./arcade.module.css"
import questStyles from "./quest.module.css"

/*
  Proof for an Insight Arcade side quest (POST /api/arcade/proof), by the quest's proof kind:
  - link: story / Add Yours quests. A link to the story or post, checked here with the same parser
    the API uses (src/lib/proof-link.ts).
  - answer: type the answer to a question (0041). Checked at once by the database: right = points,
    wrong = try again (nothing stored).
  - photo: follow quests (screenshot + username), drone soccer, merch. The photo is shrunk in the browser first (longest side 1600 px, WebP or JPEG) so uploads stay small on venue mobile data;
  the server re-encodes it again before storing (src/lib/proof-image.ts).
*/

const MAX_SIDE = 1600
/** The API's limits (src/app/api/arcade/proof/route.ts). */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const MAX_ANSWER = 60

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

async function shrink(file: File): Promise<{ blob: Blob; name: string }> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return { blob: file, name: file.name }
    // White under transparent PNGs, which would otherwise turn black as JPEG.
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    // Safari before 18 cannot encode WebP and silently returns PNG: check the type, fall back to JPEG.
    const webp = await encode(canvas, "image/webp", 0.8)
    if (webp && webp.type === "image/webp") return { blob: webp, name: "proof.webp" }
    const jpeg = await encode(canvas, "image/jpeg", 0.82)
    return jpeg ? { blob: jpeg, name: "proof.jpg" } : { blob: file, name: file.name }
  } catch {
    // Not decodable here (e.g. HEIC outside Safari): send as is, the server decides.
    return { blob: file, name: file.name }
  }
}

export default function ProofUploadForm({
  quest,
  kind,
  needsHandle,
  teams,
}: {
  quest: string
  /** sidequests.proof_kind: 'link' = send a link, 'photo' = upload a photo, 'answer' = type an answer. */
  kind: "photo" | "link" | "answer"
  needsHandle: string | null
  /** Drone soccer: the teams to vote for; undefined = no vote. */
  teams?: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [link, setLink] = useState("")
  const [answer, setAnswer] = useState("")
  const [handle, setHandle] = useState("")
  const [team, setTeam] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (kind === "photo" && !file) return setMessage({ ok: false, text: "Pilih foto bukti dulu." })
    if (kind === "answer" && !answer.trim()) return setMessage({ ok: false, text: "Tulis jawabanmu dulu." })
    if (kind === "link") {
      const checked = parseProofLink(link)
      if (!checked.ok) return setMessage({ ok: false, text: checked.message })
    }
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
      if (kind === "link") {
        body.set("link", link.trim())
      } else if (kind === "answer") {
        body.set("answer", answer.trim())
      } else if (file) {
        const photo = await shrink(file)
        if (photo.blob.size > MAX_UPLOAD_BYTES) {
          setMessage({ ok: false, text: "Foto terlalu besar (maks. 4 MB). Coba screenshot atau foto JPG/PNG." })
          return
        }
        body.set("file", photo.blob, photo.name)
        // Follow quests: the username, so one account counts once per quest.
        if (needsHandle) body.set("handle", handle)
      }
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
          kind === "answer"
            ? `Benar! +${payload.data.points} poin.`
            : payload.data.code === "PENDING"
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
    <form onSubmit={submit} className={styles.form}>
      <h2 className={styles.formTitle}>{kind === "answer" ? "Kirim jawaban" : "Kirim bukti"}</h2>
      {kind === "link" || needsHandle ? (
        <p className={styles.publicNote}>
          <strong>Pastikan akunmu publik</strong> sampai poin diverifikasi, supaya panitia bisa memeriksa
          {kind === "link" ? " linkmu" : " akunmu"}. Akun privat bisa membuat poinmu dicabut.
        </p>
      ) : null}
      {kind === "answer" ? (
        <label className={styles.field}>
          Jawabanmu
          <input
            type="text"
            className={questStyles.input}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoComplete="off"
            maxLength={MAX_ANSWER}
            required
            disabled={busy}
          />
          <span className={styles.fieldHint}>Huruf besar/kecil tidak berpengaruh.</span>
        </label>
      ) : kind === "link" ? (
        <>
          <label className={styles.field}>
            Link story atau postingan kamu
            <input
              type="url"
              inputMode="url"
              className={questStyles.input}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.instagram.com/stories/username/…"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={PROOF_LINK_MAX}
              required
              disabled={busy}
            />
            <span className={styles.fieldHint}>Buka story / postinganmu → Share (⋯) → Copy link.</span>
          </label>
        </>
      ) : (
        <>
          <label className={styles.field}>
            {needsHandle ? "Screenshot bukti follow" : "Foto bukti"}
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={busy} />
          </label>
          {needsHandle ? (
            <label className={styles.field}>
              Username {needsHandle === "instagram" ? "Instagram" : "TikTok atau X"} kamu
              <input
                type="text"
                className={questStyles.input}
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
        </>
      )}
      {teams ? (
        <label className={styles.field}>
          Tim yang kamu dukung
          <select
            className={clsx(questStyles.input, styles.select)}
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            required
            disabled={busy}
          >
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
      <button type="submit" className={clsx(questStyles.lightButton, styles.submit)} disabled={busy}>
        {busy ? "Mengirim…" : kind === "answer" ? "Kirim jawaban" : "Kirim bukti"}
      </button>
      {message ? (
        <p className={clsx(styles.message, message.ok ? styles.messageOk : styles.messageError)} role="status">
          {message.text}
        </p>
      ) : null}
    </form>
  )
}
