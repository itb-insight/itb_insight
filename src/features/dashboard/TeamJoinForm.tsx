"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import type { CompetitionSummary } from "@/lib/competitions"
import { postWithAuth } from "./apiClient"
import styles from "./Dashboard.module.css"

export default function TeamJoinForm({ competition }: { competition: CompetitionSummary }) {
  const router = useRouter()
  const slug = competition.slug.current

  const [teamUid, setTeamUid] = useState("")
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [institution, setInstitution] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [joined, setJoined] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage("")

    try {
      const result = await postWithAuth("/api/teams/join", {
        competitionSlug: slug,
        teamUid,
        name,
        phoneNumber,
        institution,
      })

      if (result.needsAuth) {
        router.push(`/login?next=${encodeURIComponent(`/dashboard/teams/join?comp=${slug}`)}`)
        return
      }

      if (!result.ok || !result.payload.success) {
        setErrorMessage(result.payload.success ? "Gagal bergabung ke tim." : result.payload.error.message)
        return
      }

      setJoined(true)
      router.refresh()
    } catch {
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  if (joined) {
    return (
      <div className={styles.form}>
        <p className={styles.messageOk}>Berhasil bergabung ke tim. Leader akan mengirim registrasi final.</p>
        <div className={styles.btnRow}>
          <button type="button" className={styles.btnPrimary} onClick={() => router.push("/dashboard")}>
            Ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="teamUid">UID Tim</label>
        <input
          id="teamUid"
          required
          value={teamUid}
          onChange={(e) => setTeamUid(e.target.value.toUpperCase())}
          placeholder={`${competition.teamUidPrefix}-XXXXXX`}
        />
        <p className={styles.hint}>Minta UID ini dari leader tim kamu.</p>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="jname">Nama</label>
        <input id="jname" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="jphone">Nomor Telepon</label>
        <input id="jphone" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="jinstitution">Institusi</label>
        <input id="jinstitution" required value={institution} onChange={(e) => setInstitution(e.target.value)} />
      </div>

      {errorMessage ? <p className={styles.messageError}>{errorMessage}</p> : null}

      <div className={styles.btnRow}>
        <button type="submit" className={styles.btnPrimary} disabled={submitting}>
          {submitting ? "Bergabung..." : "Gabung Tim"}
        </button>
      </div>
    </form>
  )
}
