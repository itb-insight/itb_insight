"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import type { CompetitionSummary } from "@/lib/competitions"
import { postWithAuth } from "./apiClient"
import styles from "./Dashboard.module.css"

export default function TeamCreateForm({ competition }: { competition: CompetitionSummary }) {
  const router = useRouter()
  const slug = competition.slug.current

  const [teamName, setTeamName] = useState("")
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [institution, setInstitution] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [createdTeam, setCreatedTeam] = useState<{ team_uid: string; team_name: string } | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage("")
    setCreatedTeam(null)

    try {
      const result = await postWithAuth<{ team: { team_uid: string; team_name: string } }>("/api/teams", {
        competitionSlug: slug,
        teamName,
        name,
        phoneNumber,
        institution,
      })

      if (result.needsAuth) {
        router.push(`/login?next=${encodeURIComponent(`/dashboard/teams/create?comp=${slug}`)}`)
        return
      }

      if (!result.ok || !result.payload.success) {
        setErrorMessage(result.payload.success ? "Gagal membuat tim." : result.payload.error.message)
        return
      }

      setCreatedTeam(result.payload.data.team)
      router.refresh()
    } catch {
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  if (createdTeam) {
    return (
      <div className={styles.form}>
        <p className={styles.messageOk}>Tim &ldquo;{createdTeam.team_name}&rdquo; berhasil dibuat sebagai draft.</p>
        <div className={styles.uidBox}>
          <p className={styles.hint}>Bagikan UID ini ke anggota tim</p>
          <p className={styles.uidValue}>{createdTeam.team_uid}</p>
        </div>
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
        <label className={styles.label} htmlFor="teamName">Nama Tim</label>
        <input id="teamName" required value={teamName} onChange={(e) => setTeamName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">Nama Leader</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="phone">Nomor Telepon</label>
        <input id="phone" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="institution">Institusi</label>
        <input id="institution" required value={institution} onChange={(e) => setInstitution(e.target.value)} />
      </div>

      {errorMessage ? <p className={styles.messageError}>{errorMessage}</p> : null}

      <div className={styles.btnRow}>
        <button type="submit" className={styles.btnPrimary} disabled={submitting}>
          {submitting ? "Membuat..." : "Buat Tim"}
        </button>
      </div>
      <p className={styles.hint}>Tim {competition.title} membutuhkan {competition.teamMin}–{competition.teamMax} anggota.</p>
    </form>
  )
}
