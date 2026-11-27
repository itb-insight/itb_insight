import { notFound } from "next/navigation"

import { getAdminAccess } from "@/lib/admin-access"
import { createClient } from "@/lib/supabase/server"

/**
 * Everything under /admin except the dashboard (/admin) and the Booth section is admin-only. The parent layout already let
 * in booth staff (src/app/admin/layout.tsx); they get a 404 here so the rest is not confirmed.
 * The route group keeps the URLs unchanged.
 */
export default async function AdminOnlyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await getAdminAccess(user)).isAdmin) notFound()

  return children
}
