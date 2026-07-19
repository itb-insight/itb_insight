"use client"

import Link from "next/link"
import { useState } from "react"

import { createClient } from "@/lib/supabase/client"
import styles from "./SignUp.module.css"

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/dashboard` : undefined

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) return

    setStatus("sending")
    setMessage("")
    setIsError(false)

    const supabase = createClient()
    // Magic-link sign-up: creates the auth user on first verification. The name is stored in
    // user metadata and picked up by the `handle_new_user` DB trigger to seed the profile.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        data: name.trim() ? { full_name: name.trim() } : undefined,
      },
    })

    if (error) {
      setStatus("idle")
      setIsError(true)
      setMessage("Gagal mengirim tautan. Periksa email lalu coba lagi.")
      return
    }

    setStatus("sent")
    setMessage(`Tautan konfirmasi telah dikirim ke ${email.trim()}. Cek inbox untuk menyelesaikan pendaftaran.`)
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
      setMessage("Gagal mendaftar dengan Google. Coba lagi.")
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
            <h2 className={styles.title}>Sign Up</h2>
            <p className={styles.subtitle}>join the experience</p>
          </div>

          <form className={styles.form} onSubmit={handleSignUp}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="signup-name">
                Name
              </label>
              <input
                id="signup-name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama lengkap"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                className={styles.input}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@student.itb.ac.id"
              />
            </div>

            <button className={styles.loginBtn} type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Mengirim..." : "Sign up with email"}
            </button>

            <p className={styles.orText}>or continue with</p>

            <button className={styles.googleBtn} type="button" onClick={handleGoogle}>
              Google
            </button>

            {message ? <p className={isError ? styles.messageError : styles.messageOk}>{message}</p> : null}

            <p className={styles.signupText}>
              Already have an account?{" "}
              <Link href="/login" className={styles.signupLink}>
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
