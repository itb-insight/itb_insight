import type { Metadata } from "next"
import AdminShell from "@/layouts/AdminShell/AdminShell"

/**
 * NOTE: /admin has no authentication in this MVP. noindex is a floor, not a
 * control — anyone with the URL can read the event feed. Real gating is the
 * first item in docs/analytics/99-known-gaps.md and must land before this
 * ships anywhere public.
 */
export const metadata: Metadata = {
  title: "ITB Insight — Admin",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
