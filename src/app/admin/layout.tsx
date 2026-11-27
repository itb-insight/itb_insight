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
 *   - every staff member (staffAccessFor): the D-day page (/admin/d-day);
 *   - booth staff (role_b 'booth', or booths assigned to their email): also the dashboard (/admin)
 *     and the Booth section;
 *   - booth stakeholders (stakeholder + role_b 'booth') and admins: also the booth access page
 *     (/admin/booth-access), which checks it itself;
 *   - gate staff (staff + human_resource + gate_staff): also the Gate section.
 * Every other page sits in the (admin-only) route group, whose layout 404s for non-admins. /admin
 * itself sends staff without the dashboard to the Gate section or D-Day.
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
  if (!access.staff) notFound()

  return (
    <AdminFrame
      isAdmin={access.isAdmin}
      booth={Boolean(access.booth)}
      boothManager={access.boothManager}
      gate={access.gate}
      staff={access.staff}
    >
      {children}
    </AdminFrame>
  )
}
