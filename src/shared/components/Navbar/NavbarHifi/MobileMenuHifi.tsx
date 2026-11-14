"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { MAP_PATH, isMapsDisabled } from "@/lib/maps"
import ComingSoon from "@/shared/components/ComingSoon/ComingSoon"
import NavAuthActionsHifi from "./NavAuthActionsHifi"
import styles from "./NavbarHifi.module.css"

const LINKS = [
  { href: MAP_PATH, label: "Map" },
  { href: "/event", label: "Event" },
  { href: "/competition", label: "Competition" },
]

export default function MobileMenuHifi({
  variant = "navbar",
  countdownOnly = false,
}: {
  variant?: "navbar" | "header"
  /** COUNTDOWN_ONLY=true: only the auth actions, no page links (they would hit the countdown). */
  countdownOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div
      ref={wrapRef}
      className={variant === "header" ? styles.menuWrapHeader : styles.menuWrapNavbar}
    >
      {variant === "header" ? (
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={styles.headerMenuBtn}
        >
          <svg width="28" height="19" viewBox="0 0 22 15" aria-hidden="true">
            <path
              d="M0 1.5h22M0 7.5h22M0 13.5h22"
              stroke="#1b3b7d"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={styles.mobileMenuBtn}
        />
      )}

      {open && (
        <div className={`${styles.mobileMenu} ${countdownOnly ? styles.mobileMenuCompact : ""}`}>
          {countdownOnly ? null : (
            <>
              {LINKS.map((link) =>
                link.href === MAP_PATH && isMapsDisabled() ? (
                  // Tap focuses it (tabIndex=0), which shows the pill on touch screens.
                  <ComingSoon key={link.href} className={styles.mobileMenuLink} placement="left">
                    {link.label}
                  </ComingSoon>
                ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileMenuLink}
                  onClick={close}
                >
                  {link.label}
                </Link>
                ),
              )}

              <div className={styles.mobileMenuDivider} />
            </>
          )}

          <div className={styles.mobileMenuAuth}>
            <NavAuthActionsHifi variant="mobile" onAction={close} hideDashboard={countdownOnly} />
          </div>
        </div>
      )}
    </div>
  )
}
