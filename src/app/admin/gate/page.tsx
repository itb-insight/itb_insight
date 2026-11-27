import { notFound, redirect } from "next/navigation"

import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import GateScanner from "@/features/gate/GateScanner"
import { getAdminAccess } from "@/lib/admin-access"
import { BONUS_POINTS, CONTRIBUTION_POINTS } from "@/lib/booth-points"
import { createClient } from "@/lib/supabase/server"

import styles from "./page.module.css"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Gate | ITB Insight Admin",
  robots: { index: false, follow: false },
}

// Gate section: gate staff (role_a 'staff', role_b 'human_resource', role_c 'gate_staff') and
// admins scan a visitor's profile QR at the entrance. That sets profiles.entered_gate (0026) and
// checks the visitor ticket in; the result shows the visitor what a booth scan looks like.
export default async function GateSectionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/gate")

  const access = await getAdminAccess(user)
  if (!access.gate) notFound()

  return (
    <>
      <PageHeader
        title="Gate"
        subtitle="Scan QR profil pengunjung saat masuk, lalu tunjukkan cara kerja scan di booth."
      />
      <div className={styles.body}>
        <GateScanner contributionPoints={CONTRIBUTION_POINTS} bonusPoints={BONUS_POINTS} />
      </div>
    </>
  )
}
