"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"
import LogOutModal from "@/shared/components/modals/LogOutModal"
import styles from "./NavbarHifi.module.css"

// Client-side auth affordance for the navbar: shows Log In / Sign up when signed out,
// and Dashboard / Sign out once a Supabase session exists.
export default function NavAuthActionsHifi({
  variant = "desktop",
  onAction,
}: {
  variant?: "desktop" | "mobile"
  onAction?: () => void
}) {
  const router = useRouter()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const primaryClass = variant === "mobile" ? styles.mobilePrimaryBtn : styles.logInBtn
  const secondaryClass = variant === "mobile" ? styles.mobileSecondaryBtn : styles.signUpBtn

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

  // Signing out is now confirmed first. Note this deliberately does NOT call onAction:
  // on mobile that closes the menu, and this component lives inside it, so the dialog
  // would be unmounted the moment it opened.
  const handleSignOutRequest = () => setConfirmOpen(true)

  const handleSignOutConfirmed = async () => {
    if (signingOut) return // a second click would fire two navigations
    setSigningOut(true)

    const supabase = createClient()
    await supabase.auth.signOut()

    setConfirmOpen(false)
    setSigningOut(false)
    setSignedIn(false)
    router.push("/")
    router.refresh()
    // Last, because on mobile it unmounts this component along with the menu.
    onAction?.()
  }

  // Render the signed-out layout until we know, to avoid a flash of the wrong state.
  if (signedIn) {
    return (
      <>
        <Link href="/dashboard" className={primaryClass} onClick={onAction}>
          Dashboard
        </Link>
        <button
          type="button"
          onClick={handleSignOutRequest}
          className={secondaryClass}
          aria-haspopup="dialog"
          aria-expanded={confirmOpen}
        >
          Sign out
        </button>

        <LogOutModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleSignOutConfirmed}
        />
      </>
    )
  }

  return (
    <>
      <Link href="/login" className={primaryClass} onClick={onAction}>
        Log In
      </Link>
      <Link href="/signup" className={secondaryClass} onClick={onAction}>
        Sign Up
      </Link>
    </>
  )
}
