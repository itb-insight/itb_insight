"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import styles from "./AdminSidebarHifi.module.css"
import { ADMIN_NAV } from "./adminNav"

interface AdminSidebarHifiProps {
  activeHref?: string
}

export default function AdminSidebarHifi({ activeHref }: AdminSidebarHifiProps) {
  const pathname = usePathname()
  const current = activeHref ?? pathname

  return (
    <aside className={styles.sidebar}>
      <p className={styles.brand}>Admin</p>

      <nav className={styles.groups} aria-label="Navigasi admin">
        {ADMIN_NAV.map((group) => (
          <div key={group.title} className={styles.group}>
            <p className={styles.groupTitle}>{group.title}</p>

            <ul className={styles.items}>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = current === item.href || current.startsWith(`${item.href}/`)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.item} ${active ? styles.itemActive : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className={styles.icon} />
                      <span className={styles.label}>{item.label}</span>
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
