"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import styles from "./AdminFrame.module.css"
import { adminNavFor, isNavItemActive } from "./adminNav"

/** Below 1100px the sidebar is hidden: the same menu as a row of chips that scrolls sideways. */
export default function AdminMobileNav({ activeHref, isAdmin = true }: { activeHref?: string; isAdmin?: boolean }) {
  const pathname = usePathname()
  const current = activeHref ?? pathname
  const items = adminNavFor(isAdmin).flatMap((section) => section.items)

  // One section (booth staff): nothing to switch to.
  if (items.length < 2) return null

  return (
    <nav className={styles.mobileNav} aria-label="Navigasi admin">
      <ul className={styles.mobileNavList}>
        {items.map((item) => {
          const active = isNavItemActive(item.href, current)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
