"use client"

import Link from "next/link"
import { useState } from "react"

import { createClient } from "@/lib/supabase/client"
import useFunnelStep from "@/lib/analytics/hooks/useFunnelStep"
import styles from "./SignUp.module.css"

export default function SignUp() {
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