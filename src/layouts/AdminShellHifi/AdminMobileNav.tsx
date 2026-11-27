"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import styles from "./AdminFrame.module.css"
import { adminNavFor, ALL_SECTIONS, isNavItemActive, type NavSections } from "./adminNav"

/*
  Below 1100px the sidebar is hidden: the same menu as a dropdown, like the /dashboard one
  (DashboardSidebar mobileMode="dropdown"). Under 900px the trigger sits in the middle of the site
  navbar and the panel drops down under it; from 900px the navbar shows its own links, so the
  trigger sits at the top of the page instead.
*/
export default function AdminMobileNav({
  activeHref,
  sections = ALL_SECTIONS,
}: {
  activeHref?: string
  sections?: NavSections
}) {
  const pathname = usePathname()
  const current = activeHref ?? pathname
  // The path the menu was opened on: navigating anywhere (links, back button) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null)
  const groups = adminNavFor(sections)
  const items = groups.flatMap((group) => group.items)
  const currentItem = items.find((item) => isNavItemActive(item.href, current))

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  // One section (e.g. gate staff): nothing to switch to.
  if (items.length < 2) return null

  return (
    <div className={styles.mobileNav}>
      <button
        type="button"
        className={styles.mobileTrigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="admin-mobile-menu"
      >
        <span>{currentItem?.label ?? "Admin"}</span>
        <ChevronDown size={20} aria-hidden="true" className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
      </button>

      {open ? <button type="button" className={styles.mobileBackdrop} aria-label="Tutup menu" onClick={() => setOpen(false)} /> : null}

      <div className={`${styles.mobileCollapse} ${open ? styles.mobileCollapseOpen : ""}`}>
        <nav id="admin-mobile-menu" className={styles.mobileMenu} aria-label="Navigasi admin" inert={!open}>
          {groups.map((group) => (
            <div key={group.title} className={styles.mobileGroup}>
              <p className={styles.mobileGroupTitle}>{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isNavItemActive(item.href, current)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.mobileItem} ${active ? styles.mobileItemActive : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className={styles.mobileIcon} />
                    <span className={styles.mobileLabel}>{item.label}</span>
                    {item.soon ? <span className={styles.mobileSoon}>soon</span> : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
