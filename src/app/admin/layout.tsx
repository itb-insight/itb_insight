import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import AdminShell from "@/layouts/AdminShell/AdminShell"
import { isAdminUser } from "@/lib/admin"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "ITB Insight — Admin",
  robots: { index: false, follow: false },
}

/**
 * Every /admin page is admin-only. Signed-out visitors go to /login (the proxy redirects them
 * too); signed-in non-admins get a 404 so the area's existence is not confirmed.
 * Reading the session makes every admin page dynamic, which is what we want here.
 * The admin API routes check the role themselves (tests/guardrails/api-auth.test.ts).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/admin")
  if (!(await isAdminUser(user))) notFound()

  return <AdminShell>{children}</AdminShell>
}
