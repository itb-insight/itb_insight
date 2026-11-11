import Link from "next/link"

import TeamCreateForm from "@/features/dashboard/TeamCreateForm"
import dashboardStyles from "@/features/dashboard/Dashboard.module.css"
import { getCompetitionBySlug } from "@/lib/competitions"

type TeamCreatePageProps = {
  searchParams: Promise<{ comp?: string }>
}

export default async function TeamCreatePage({ searchParams }: TeamCreatePageProps) {
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
          <p className={dashboardStyles.eyebrow}>Buat Tim</p>
          <h1 className={dashboardStyles.title}>{competition.title}</h1>
          <p className={dashboardStyles.subtitle}>
            Tim dibuat sebagai draft. Setelah dibuat, bagikan UID ke anggota agar mereka bisa bergabung sebelum
            registrasi final dikirim.
          </p>
        </header>
        <TeamCreateForm competition={competition} />
      </div>
    </main>
  )
}
