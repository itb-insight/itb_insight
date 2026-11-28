"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { safeNext } from "@/lib/safe-next"
import { createClient } from "@/lib/supabase/client"
import styles from "./LoginHifi.module.css"

// Sign-in is Google only (Supabase Auth). The OAuth round trip lands on /auth/callback, which
// creates the session and sends the user on to `next`. New Google accounts are created on their
// first sign-in, so this page and /signup do the same thing.
export default function LoginHifi() {
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get("next"))
  const hadAuthError = searchParams.get("error") === "auth-code"

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(hadAuthError ? "Gagal masuk dengan Google. Coba lagi." : "")

  const handleGoogle = async () => {
    setBusy(true)
    setMessage("")
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    // On success the browser is already leaving for Google.
    if (error) {
      setBusy(false)
      setMessage("Gagal masuk dengan Google. Coba lagi.")
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Log In</h2>
            <p className={styles.subtitle}>Join the experience</p>
          </div>

          <div className={styles.form}>
            <button className={styles.googleBtn} type="button" onClick={handleGoogle} disabled={busy}>
              <svg className={styles.googleIcon} viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              {busy ? "Membuka Google..." : "Continue with Google"}
            </button>

            {message ? <p className={styles.messageError}>{message}</p> : null}

            <p className={styles.signupText}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className={styles.signupLink}>
                Sign up
              </Link>
            </p>

            <p className={styles.signupText}>
              By continuing, you agree to our{" "}
              <Link href="/terms" className={styles.signupLink}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className={styles.signupLink}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
