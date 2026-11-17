"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { clearSessionCookies, notifySessionChanged, useHasSession } from "@/shared/hooks/useHasSession"
import LogOutModal from "@/shared/components/modals/LogOutModal"
import styles from "./NavbarHifi.module.css"

// Client-side auth affordance for the navbar: shows Log In / Sign up when signed out,
// and Dashboard / Sign out once a Supabase session cookie exists. The Supabase SDK is loaded
// only when someone signs out, so public pages don't ship it (see useHasSession).
export default function NavAuthActionsHifi({
  variant = "desktop",
  onAction,
  hideDashboard = false,
}: {
  variant?: "desktop" | "mobile"
  onAction?: () => void
  /** COUNTDOWN_ONLY=true: the dashboard is behind the countdown, so only "Sign out" is shown. */
  hideDashboard?: boolean
}) {
  const router = useRouter()
  const signedIn = useHasSession()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const primaryClass = variant === "mobile" ? styles.mobilePrimaryBtn : styles.logInBtn
  const secondaryClass = variant === "mobile" ? styles.mobileSecondaryBtn : styles.signUpBtn

  // Signing out is now confirmed first. Note this deliberately does NOT call onAction:
  // on mobile that closes the menu, and this component lives inside it, so the dialog
  // would be unmounted the moment it opened.
  const handleSignOutRequest = () => setConfirmOpen(true)

  const handleSignOutConfirmed = async () => {
    if (signingOut) return // a second click would fire two navigations
    setSigningOut(true)

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const { error } = await createClient().auth.signOut()
      if (error) console.warn("Sign-out did not complete on the server:", error.message)
    } catch (error) {
      console.warn("Sign-out failed:", error)
    } finally {
      // signOut() keeps the session cookie when it fails; drop it here so this browser is signed
      // out either way (the server rejects a revoked session regardless).
      clearSessionCookies()
    }

    setConfirmOpen(false)
    setSigningOut(false)
    notifySessionChanged()
    router.push("/")
    router.refresh()
    // Last, because on mobile it unmounts this component along with the menu.
    onAction?.()
  }

  // Render the signed-out layout until we know, to avoid a flash of the wrong state.
  if (signedIn) {
    return (
      <>
        {hideDashboard ? null : (
          <Link href="/dashboard" className={primaryClass} onClick={onAction}>
            Dashboard
          </Link>
        )}
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
