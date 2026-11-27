import { notFound, redirect } from "next/navigation"

import DDayDashboard from "@/features/admin/components/DDay/DDayDashboard"
import { getDDay } from "@/features/admin/data/adapters"
import { getAdminAccess } from "@/lib/admin-access"
import { DDAY_PATH } from "@/lib/admin-nav"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "D-Day | ITB Insight Admin",
  robots: { index: false, follow: false },
}

// D-Day: every staff member (staffAccessFor in src/lib/admin-access.ts). Today's live headcount,
// check-ins, booths and staff scans; refreshes every 30 s (GET /api/admin/d-day).
export default async function DDayPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${DDAY_PATH}`)

  const access = await getAdminAccess(user)
  if (!access.staff) notFound()

  return <DDayDashboard initial={await getDDay()} />
}
