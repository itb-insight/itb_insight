import { notFound, redirect } from "next/navigation"

import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import BoothPointsScanner from "@/features/booth-points/BoothPointsScanner"
import { getAdminAccess } from "@/lib/admin-access"
import { BONUS_POINTS, BOOTH_POINTS_PRACTICE, CONTRIBUTION_POINTS, boothsInScope } from "@/lib/booth-points"
import { createClient } from "@/lib/supabase/server"

import styles from "./page.module.css"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Booth | ITB Insight Admin",
  robots: { index: false, follow: false },
}

// Booth section: booth staff (role_b 'booth') and admins scan a visitor's profile QR and give
// Contribution / Bonus points for one of their booths. Rules: src/lib/booth-points.ts.
export default async function BoothSectionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/booth")

  const access = await getAdminAccess(user)
  if (!access.booth) notFound()

  return (
    <>
      <PageHeader
        title="Booth"
        subtitle="Scan QR profil pengunjung, pilih booth, lalu beri Contribution atau Bonus."
        meta={BOOTH_POINTS_PRACTICE ? "Mode latihan" : undefined}
      />
      <div className={styles.body}>
        <BoothPointsScanner
          booths={boothsInScope(access.booth.scope)}
          practice={BOOTH_POINTS_PRACTICE}
          contributionPoints={CONTRIBUTION_POINTS}
          bonusPoints={BONUS_POINTS}
        />
      </div>
    </>
  )
}
