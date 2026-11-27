import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import AdminFrame from "@/layouts/AdminShellHifi/AdminFrame"
import { getAdminAccess } from "@/lib/admin-access"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "ITB Insight — Admin",
  robots: { index: false, follow: false },
}

/**
 * Who gets into /admin (src/lib/admin-access.ts):
 *   - admins: everything;
 *   - booth staff (role_b 'booth'): the dashboard (/admin) and the Booth section. Every other
 *     page sits in the (admin-only) route group, whose layout 404s for non-admins;
 *   - gate staff (staff + human_resource + gate_staff): the Gate section only (/admin sends them there).
 * Signed-out visitors go to /login (the proxy redirects them too); everyone else gets a 404 so the
 * area's existence is not confirmed. Reading the session makes every admin page dynamic.
 * The admin API routes check the role themselves (tests/guardrails/api-auth.test.ts).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/admin")

  const access = await getAdminAccess(user)
  if (!access.isAdmin && !access.booth && !access.gate) notFound()

  return (
    <AdminFrame isAdmin={access.isAdmin} booth={Boolean(access.booth)} gate={access.gate}>
      {children}
    </AdminFrame>
  )
}
