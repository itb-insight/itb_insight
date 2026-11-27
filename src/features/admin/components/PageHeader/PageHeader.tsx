import AdminPageHeader, { AdminPill } from "@/layouts/AdminShellHifi/AdminPageHeader"

import styles from "./PageHeader.module.css"

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Short status text, shown as a pill (e.g. "Live · PostHog + Supabase"). */
  meta?: string
}

/**
 * Header of an /admin page: the shared hi-fi AdminPageHeader with page padding. The frame around
 * it (navbar, sidebar) comes from src/app/admin/layout.tsx.
 */
export default function PageHeader({ title, subtitle, meta }: PageHeaderProps) {
  return (
    <div className={styles.wrap}>
      <AdminPageHeader title={title} subtitle={subtitle} meta={meta ? <AdminPill>{meta}</AdminPill> : undefined} />
    </div>
  )
}
