import { notFound, redirect } from "next/navigation"

import BoothScanner from "@/features/booth-scan/BoothScanner"
import { getUserRole } from "@/lib/admin"
import { BOOTH_AWARD_ROLES, getScannerBooths } from "@/lib/booths"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Scan Poin Booth | ITB Insight",
  robots: { index: false, follow: false },
}

// Booth staff scan a visitor's personal QR and give booth points (rules: src/lib/booths.ts).
// Only roles that POST /api/booths/scan accepts can open it; everyone else gets a 404.
export default async function BoothScanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/booth-scan")

  const role = await getUserRole(user)
  if (!role || !BOOTH_AWARD_ROLES.includes(role)) notFound()

  const booths = await getScannerBooths(user.id, role)

  return <BoothScanner booths={booths} canPickAnyBooth={role === "admin" || role === "field_staff"} />
}
