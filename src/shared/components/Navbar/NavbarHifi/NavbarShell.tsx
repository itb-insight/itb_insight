"use client"

import { useSyncExternalStore, type ReactNode } from "react"

/**
 * Pembungkus <nav> yang tahu apakah halaman sudah di-scroll.
 *
 * Di desktop, navbar transparan di puncak halaman lalu mendapat "pil"
 * melayang di belakang isinya begitu di-scroll (lihat .navbar::before di
 * NavbarHifi.module.css), supaya tautan tetap terbaca di atas konten apa
 * pun. Komponen ini hanya menyalakan class `scrolledClassName`.
 *
 * useSyncExternalStore, bukan useState + useEffect: nilai awal dibaca
 * langsung dari window.scrollY (halaman yang dibuka di tengah scroll atau
 * hasil restore scroll browser langsung benar), dan render server selalu
 * false sehingga tidak ada hydration mismatch.
 */
const THRESHOLD = 24

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true })
  return () => window.removeEventListener("scroll", onChange)
}

const getSnapshot = () => window.scrollY > THRESHOLD
const getServerSnapshot = () => false

export default function NavbarShell({
  className,
  scrolledClassName,
  children,
}: {
  className: string
  scrolledClassName: string
  children: ReactNode
}) {
  const scrolled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return <nav className={scrolled ? `${className} ${scrolledClassName}` : className}>{children}</nav>
}
