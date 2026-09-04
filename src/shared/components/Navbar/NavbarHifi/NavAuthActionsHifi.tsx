"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"
import styles from "./NavbarHifi.module.css"

// Client-side auth affordance for the navbar: shows Log In / Sign up when signed out,
// and Dashboard / Sign out once a Supabase session exists.
export default function NavAuthActionsHifi() {
  const router = useRouter()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    // Supabase not configured yet (e.g. env not filled) — stay in the signed-out layout.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSignedIn(false)
      return
    }

    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user))
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSignedIn(false)
    router.push("/")
    router.refresh()
  }

  // Render the signed-out layout until we know, to avoid a flash of the wrong state.
  if (signedIn) {
    return (
      <>
        <Link href="/dashboard" className={styles.logInBtn}>
          Dashboard
        </Link>
        <button type="button" onClick={handleSignOut} className={styles.signUpBtn}>
          Sign out
        </button>
      </>
    )
  }

  return (
    <>
      <Link href="/login" className={styles.logInBtn}>
        Log In
      </Link>
      <Link href="/register" className={styles.signUpBtn}>
        Sign Up
      </Link>
    </>
  )
}
