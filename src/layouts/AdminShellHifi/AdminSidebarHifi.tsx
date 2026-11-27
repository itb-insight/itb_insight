"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import styles from "./AdminSidebarHifi.module.css"
import { adminNavFor, ALL_SECTIONS, isNavItemActive, type NavSections } from "./adminNav"

interface AdminSidebarHifiProps {
  activeHref?: string
  /** What this user can open; the menu shows only that. Default: everything (admin). */
  sections?: NavSections
}

export default function AdminSidebarHifi({ activeHref, sections = ALL_SECTIONS }: AdminSidebarHifiProps) {
  const pathname = usePathname()
  const current = activeHref ?? pathname

  return (
    <aside className={styles.sidebar}>
      <p className={styles.brand}>Admin</p>

      <nav className={styles.groups} aria-label="Navigasi admin">
        {adminNavFor(sections).map((group) => (
          <div key={group.title} className={styles.group}>
            <p className={styles.groupTitle}>{group.title}</p>

            <ul className={styles.items}>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isNavItemActive(item.href, current)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.item} ${active ? styles.itemActive : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className={styles.icon} />
                      <span className={styles.label}>{item.label}</span>
                      {item.soon ? <span className={styles.soon}>soon</span> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
