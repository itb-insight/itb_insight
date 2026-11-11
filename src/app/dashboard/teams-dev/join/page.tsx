import Link from "next/link"

import TeamJoinForm from "@/features/dashboard/TeamJoinForm"
import dashboardStyles from "@/features/dashboard/Dashboard.module.css"
import { getCompetitionBySlug } from "@/lib/competitions"

type TeamJoinPageProps = {
  searchParams: Promise<{ comp?: string }>
}

export default async function TeamJoinPage({ searchParams }: TeamJoinPageProps) {
  const { comp } = await searchParams
  const competition = comp ? await getCompetitionBySlug(comp) : null

  if (!comp || !competition || competition.registrationType !== "team") {
    return (
      <main className={dashboardStyles.page}>
        <div className={dashboardStyles.container}>
          <h1 className={dashboardStyles.title}>Kompetisi tim tidak ditemukan</h1>
          <p className={dashboardStyles.subtitle}>Pilih kompetisi bertipe tim dari daftar kompetisi.</p>
          <div className={dashboardStyles.btnRow}>
            <Link href="/dashboard/register-competition" className={dashboardStyles.btnPrimary}>
              Ke daftar kompetisi
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={dashboardStyles.page}>
      <div className={dashboardStyles.container}>
        <header className={dashboardStyles.header}>
          <Link href="/dashboard/register-competition" className={dashboardStyles.backLink}>
            ← Kembali ke pilihan kompetisi
          </Link>
          <p className={dashboardStyles.eyebrow}>Gabung Tim</p>
          <h1 className={dashboardStyles.title}>{competition.title}</h1>
          <p className={dashboardStyles.subtitle}>
            Masukkan UID dari leader tim. Keanggotaan hanya bisa diubah selama tim masih berstatus draft.
          </p>
        </header>
        <TeamJoinForm competition={competition} />
      </div>
    </main>
  )
}
