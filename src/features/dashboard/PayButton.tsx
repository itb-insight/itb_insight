"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { getWithAuth, postWithAuth } from "./apiClient"
import styles from "./Dashboard.module.css"

type PayState = "unpaid" | "pending" | "retry"

const labels: Record<PayState, string> = {
  unpaid: "Bayar Sekarang",
  pending: "Lanjutkan Pembayaran",
  retry: "Bayar Ulang",
}

type CreateData = { redirectUrl: string | null; orderId: string; isMock: boolean }

// Starts / resumes a payment. The amount is NEVER sent from here: the server derives it from the
// competition config (CMP-14). Real payments redirect to Midtrans' hosted page; status is then
// confirmed by the server-verified webhook, never by this redirect (CMP-13).
export default function PayButton({
  registrationId,
  state,
  amountLabel,
}: {
  registrationId: string
  state: PayState
  amountLabel?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<"pay" | "check" | null>(null)
  const [message, setMessage] = useState("")

  const goLogin = () => router.push("/login?next=/dashboard")

  const handlePay = async () => {
    setBusy("pay")
    setMessage("")

    try {
      const result = await postWithAuth<CreateData>("/api/payments/create", { registrationId })

      if (result.needsAuth) return goLogin()

      if (!result.ok || !result.payload.success) {
        setMessage(result.payload.success ? "Gagal memulai pembayaran." : result.payload.error.message)
        return
      }

      const { redirectUrl, orderId, isMock } = result.payload.data

      if (isMock) {
        // Local development without Midtrans credentials: simulate a settled payment.
        const settled = await postWithAuth("/api/payments/mock-settle", { orderId })
        if (!settled.needsAuth && settled.ok) {
          router.refresh()
          return
        }
        setMessage("Mode simulasi: gagal menyelesaikan pembayaran.")
        return
      }

      if (!redirectUrl) {
        setMessage("Halaman pembayaran tidak tersedia. Coba lagi.")
        return
      }

      window.location.assign(redirectUrl)
    } catch {
      setMessage("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setBusy(null)
    }
  }

  const handleCheck = async () => {
    setBusy("check")
    setMessage("")

    try {
      const result = await getWithAuth(`/api/payments/status?registrationId=${registrationId}&sync=1`)

      if (result.needsAuth) return goLogin()

      if (!result.ok || !result.payload.success) {
        setMessage(result.payload.success ? "Gagal memeriksa status." : result.payload.error.message)
        return
      }

      router.refresh()
    } catch {
      setMessage("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={styles.payRow}>
      <div className={styles.btnRow}>
        <button type="button" className={styles.btnPrimary} onClick={handlePay} disabled={busy !== null}>
          {busy === "pay" ? "Memproses..." : `${labels[state]}${amountLabel ? ` · ${amountLabel}` : ""}`}
        </button>
        {state === "pending" ? (
          <button type="button" className={styles.btnOutline} onClick={handleCheck} disabled={busy !== null}>
            {busy === "check" ? "Memeriksa..." : "Cek Status"}
          </button>
        ) : null}
      </div>
      {state === "pending" ? (
        <p className={styles.hint}>Sudah membayar? Status diperbarui otomatis, atau tekan Cek Status.</p>
      ) : null}
      {message ? <p className={styles.messageError}>{message}</p> : null}
    </div>
  )
}
