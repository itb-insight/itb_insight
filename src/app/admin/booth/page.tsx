import { notFound, redirect } from "next/navigation"

import LinkButtonHifi from "@/features/admin-hifi/LinkButtonHifi"
import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import BoothPointsScanner from "@/features/booth-points/BoothPointsScanner"
import { getAdminAccess } from "@/lib/admin-access"
import { BOOTH_ACCESS_PATH } from "@/lib/admin-nav"
import { arcadeWindow, getArcadeSettings, wibClock } from "@/lib/arcade"
import { BOOTH_POINTS_PRACTICE } from "@/lib/booth-points"
import { loadBoothsInScope } from "@/lib/booth-roster"
import { createClient } from "@/lib/supabase/server"

import styles from "./page.module.css"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Booth | ITB Insight Admin",
  robots: { index: false, follow: false },
}

// Booth section: booth staff and admins scan a visitor's profile QR and give Insight Arcade
// Contribution / Bonus points for one of their booths (assigned at /admin/booth-access).
// Rules: src/lib/booth-points.ts; the game window and kill switch: src/lib/arcade.ts.
export default async function BoothSectionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/booth")

  const access = await getAdminAccess(user)
  if (!access.booth) notFound()

  const [booths, settings] = await Promise.all([loadBoothsInScope(access.booth.scope), getArcadeSettings()])
  const gameWindow = settings ? arcadeWindow(settings) : null
  const meta = BOOTH_POINTS_PRACTICE
    ? "Mode latihan"
    : !settings
      ? undefined
      : settings.pausedAt
        ? "Dijeda panitia"
        : gameWindow === "not_started"
          ? `Dibuka ${wibClock(settings.opensAt)} WIB`
          : gameWindow === "frozen"
            ? `Ditutup ${wibClock(settings.freezesAt)} WIB`
            : `Insight Arcade buka sampai ${wibClock(settings.freezesAt)} WIB`

  return (
    <>
      <PageHeader
        title="Booth"
        subtitle="Scan QR profil pengunjung, pilih booth, lalu beri Contribution atau Bonus."
        meta={meta}
      />
      <div className={styles.body}>
        {access.boothManager ? (
          <div className={styles.manage}>
            <LinkButtonHifi
              title="Kelola akses booth"
              description="Atur booth mana yang bisa di-scan tiap LO, dan lihat riwayat perubahannya."
              href={BOOTH_ACCESS_PATH}
            />
          </div>
        ) : null}
        <BoothPointsScanner booths={booths} practice={BOOTH_POINTS_PRACTICE} staffUserId={user.id} />
      </div>
    </>
  )
}
