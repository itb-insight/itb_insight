import type { ReactNode } from "react"

import AdminFrame from "./AdminFrame"
import AdminPageHeader from "./AdminPageHeader"
import styles from "./AdminShellHifi.module.css"

export { AdminPill } from "./AdminPageHeader"

interface AdminPageHifiProps {
  title: string
  subtitle?: string
  meta?: ReactNode
  children: ReactNode
}

/**
 * A hi-fi page inside the frame: padding, AdminPageHeader and the content stack. /admin pages get
 * AdminFrame from their layout and render this directly (e.g. /admin/d-day).
 */
export function AdminPageHifi({ title, subtitle, meta, children }: AdminPageHifiProps) {
  return (
    <div className={styles.page}>
      <AdminPageHeader title={title} subtitle={subtitle} meta={meta} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}

/**
 * Whole-page shell for the /admin-hifi mocks, which live outside the /admin layout: the shared
 * AdminFrame plus AdminPageHifi.
 */
export default function AdminShellHifi({
  activeHref,
  ...page
}: AdminPageHifiProps & { activeHref?: string }) {
  return (
    <AdminFrame activeHref={activeHref}>
      <AdminPageHifi {...page} />
    </AdminFrame>
  )
}
