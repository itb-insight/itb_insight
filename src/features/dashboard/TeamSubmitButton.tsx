"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { postWithAuth } from "./apiClient"
import styles from "./Dashboard.module.css"

export default function TeamSubmitButton({ teamId, disabledReason }: { teamId: string; disabledReason?: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async () => {
    setSubmitting(true)
    setErrorMessage("")

    try {
      const result = await postWithAuth("/api/registrations/team", { teamId })

      if (result.needsAuth) {
        router.push("/login?next=/dashboard")
        return
      }

      if (!result.ok || !result.payload.success) {
        setErrorMessage(result.payload.success ? "Gagal mengirim registrasi." : result.payload.error.message)
        return
      }

      router.refresh()
    } catch {
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        className={styles.btnPrimary}
        onClick={handleSubmit}
        disabled={submitting || Boolean(disabledReason)}
        title={disabledReason}
      >
        {submitting ? "Mengirim..." : "Submit Registrasi"}
      </button>
      {disabledReason ? <p className={styles.hint}>{disabledReason}</p> : null}
      {errorMessage ? <p className={styles.messageError}>{errorMessage}</p> : null}
    </div>
  )
}
