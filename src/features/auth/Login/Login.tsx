"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { createClient } from "@/lib/supabase/client"
import styles from "./Login.module.css"

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
}

export default function Login() {
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get("next"))
  const hadAuthError = searchParams.get("error") === "auth-code"

  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [message, setMessage] = useState(hadAuthError ? "Tautan masuk tidak valid atau kedaluwarsa. Coba lagi." : "")
  const [isError, setIsError] = useState(hadAuthError)

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined

  const handleMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) return

    setStatus("sending")
    setMessage("")
    setIsError(false)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setStatus("idle")
      setIsError(true)
      setMessage("Gagal mengirim tautan. Periksa email lalu coba lagi.")
      return
    }

    setStatus("sent")
    setMessage(`Tautan masuk telah dikirim ke ${email.trim()}. Cek inbox kamu.`)
  }

  const handleGoogle = async () => {
    setIsError(false)
    setMessage("")
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })
    if (error) {
      setIsError(true)
      setMessage("Gagal masuk dengan Google. Coba lagi.")
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <Link href="/">
          <button className={styles.back}>Back</button>
        </Link>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Log in</h2>
            <p className={styles.subtitle}>Log in to join the experience</p>
          </div>

          <form className={styles.form} onSubmit={handleMagicLink}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                className={styles.input}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@student.itb.ac.id"
              />
            </div>

            <button className={styles.loginBtn} type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Mengirim..." : "Send magic link"}
            </button>

            <p className={styles.orText}>or continue with</p>

            <button className={styles.googleBtn} type="button" onClick={handleGoogle}>
              Google
            </button>

            {message ? <p className={isError ? styles.messageError : styles.messageOk}>{message}</p> : null}

            <p className={styles.signupText}>
              Don&apos;t have an account?{" "}
              <Link href="/register" className={styles.signupLink}>
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
