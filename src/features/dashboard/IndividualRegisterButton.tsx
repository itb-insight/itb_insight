"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { postWithAuth } from "./apiClient"
import styles from "./Dashboard.module.css"

export default function IndividualRegisterButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage("")
    setIsError(false)

    try {
      const result = await postWithAuth("/api/registrations/individual", { competitionSlug: slug, phoneNumber })

      if (result.needsAuth) {
        router.push(`/login?next=${encodeURIComponent("/dashboard/register-competition")}`)
        return
      }

      if (!result.ok || !result.payload.success) {
        setIsError(true)
        setMessage(result.payload.success ? "Gagal mendaftar." : result.payload.error.message)
        return
      }

      setMessage("Registrasi individu berhasil dikirim.")
      router.refresh()
    } catch {
      setIsError(true)
      setMessage("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.btnRow} style={{ flexDirection: "column", alignItems: "stretch" }}>
      <input
        aria-label="Nomor telepon"
        required
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="Nomor telepon"
      />
      <button type="submit" className={styles.btnPrimary} disabled={submitting}>
        {submitting ? "Mendaftar..." : "Daftar Individu"}
      </button>
      {message ? <p className={isError ? styles.messageError : styles.messageOk}>{message}</p> : null}
    </form>
  )
}
