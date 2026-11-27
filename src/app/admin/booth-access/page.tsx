import { notFound, redirect } from "next/navigation"

import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import BoothAccessManager from "@/features/booth-points/BoothAccessManager"
import { getAdminAccess } from "@/lib/admin-access"
import { BOOTH_ACCESS_PATH } from "@/lib/admin-nav"
import { loadBoothAccessOverview } from "@/lib/booth-roster"
import { createClient } from "@/lib/supabase/server"

import styles from "./page.module.css"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Akses Booth | ITB Insight Admin",
  robots: { index: false, follow: false },
}

// Booth access: booth stakeholders (role_a 'stakeholder' + role_b 'booth') and admins see who can
// scan at which booth, add and remove booth assignments, and read the change history.
// Not in the (admin-only) group: stakeholders are not admins, so the page checks access itself.
// Writes: POST /api/booth-points/access. Data: src/lib/booth-roster.ts.
export default async function BoothAccessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${BOOTH_ACCESS_PATH}`)

  const access = await getAdminAccess(user)
  if (!access.boothManager) notFound()

  const overview = await loadBoothAccessOverview()

  return (
    <>
      <PageHeader
        title="Akses Booth"
        subtitle="Atur booth mana yang bisa di-scan tiap LO. Perubahan langsung berlaku dan tercatat di riwayat."
      />
      <div className={styles.body}>
        <BoothAccessManager overview={overview} />
      </div>
    </>
  )
}
