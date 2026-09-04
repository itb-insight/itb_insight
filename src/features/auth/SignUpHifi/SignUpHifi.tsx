"use client"

import Link from "next/link"
import { useState } from "react"

import { createClient } from "@/lib/supabase/client"
import useFunnelStep from "@/lib/analytics/hooks/useFunnelStep"
import styles from "./SignUpHifi.module.css"

export default function SignUpHifi() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  // Entering the form is step 1 of the registration funnel. If the visitor
  // leaves without calling complete(), AnalyticsRoot derives the drop-off on
  // page hide — no extra instrumentation needed here.
  const { complete } = useFunnelStep({
    funnelId: "signup",
    step: "reg_started",
    stepIndex: 1,
    division: "CPT",
  })

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

    // Link sent successfully — mark the funnel step complete. No form values are
    // ever passed to complete(); the funnel records that the step happened, never who did it.
    complete()

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
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Sign Up</h2>
            <p className={styles.subtitle}>Join the experience</p>
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
                placeholder="Insert Name"
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
                placeholder="Insert Email"
              />
            </div>

            <button className={styles.loginBtn} type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Mengirim..." : "Sign up with email"}
            </button>

            <p className={styles.orText}>or continue with</p>

            <button className={styles.googleBtn} type="button" onClick={handleGoogle}>
              <svg className={styles.googleIcon} viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              Continue with Google
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
