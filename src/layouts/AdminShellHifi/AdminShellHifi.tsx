import type { ReactNode } from "react"

import AdminFrame from "./AdminFrame"
import AdminPageHeader from "./AdminPageHeader"
import styles from "./AdminShellHifi.module.css"

export { AdminPill } from "./AdminPageHeader"

interface AdminShellHifiProps {
  title: string
  subtitle?: string
  meta?: ReactNode
  activeHref?: string
  children: ReactNode
}

/**
 * Whole-page shell for the /admin-hifi mocks, which live outside the /admin layout: the shared
 * AdminFrame plus a padded page with AdminPageHeader. /admin pages get AdminFrame from their layout
 * and only render PageHeader.
 */
export default function AdminShellHifi({ title, subtitle, meta, activeHref, children }: AdminShellHifiProps) {
  return (
    <AdminFrame activeHref={activeHref}>
      <div className={styles.page}>
        <AdminPageHeader title={title} subtitle={subtitle} meta={meta} />
        <div className={styles.content}>{children}</div>
      </div>
    </AdminFrame>
  )
}
