"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import NavAuthActionsHifi from "./NavAuthActionsHifi"
import styles from "./NavbarHifi.module.css"

const LINKS = [
  { href: "/event-map", label: "Map" },
  { href: "/event", label: "Event" },
  { href: "/competition", label: "Competition" },
]

export default function MobileMenuHifi({
  variant = "navbar",
}: {
  variant?: "navbar" | "header"
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
          <svg width="22" height="15" viewBox="0 0 22 15" aria-hidden="true">
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
        <div className={styles.mobileMenu}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.mobileMenuLink}
              onClick={close}
            >
              {link.label}
            </Link>
          ))}

          <div className={styles.mobileMenuDivider} />

          <div className={styles.mobileMenuAuth}>
            <NavAuthActionsHifi variant="mobile" onAction={close} />
          </div>
        </div>
      )}
    </div>
  )
}
