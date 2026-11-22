import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import CompetitionLab, { type LabDefaults } from "@/features/admin/competition-lab/CompetitionLab"
import labStyles from "@/features/admin/competition-lab/CompetitionLab.module.css"
import type { ActivityEntry } from "@/features/home/activityTypes"
import ActivityCard from "@/features/home/ActivityCard"
import { findTeamIds, listLabTeams } from "@/lib/competition-lab"
import { getCompetitions } from "@/lib/competitions"
import { getActivityForTeams } from "@/lib/dashboard-activity"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Competition (test lab) | ITB Insight Admin",
  robots: { index: false, follow: false },
}

/** name+tag@domain: a second address that still lands in the admin's own inbox (Gmail and most others). */
function plusAlias(email: string, tag: string) {
  const [local, domain] = email.split("@")
  return local && domain ? `${local.split("+")[0]}+${tag}@${domain}` : ""
}

/** Time of this request (the page is dynamic), read outside render for react-hooks/purity. */
function requestTime() {
  return Date.now()
}

// Admin-only (src/app/admin/layout.tsx). Test bench for imported teams and shadow members:
// seed a test team, claim/release slots, preview any team's dashboard card, reset.
export default async function AdminCompetitionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const preview = typeof params.preview === "string" ? params.preview.slice(0, 254) : ""
  const now = requestTime()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const service = createServiceClient()

  const [teams, catalog, profileResult, previewIds] = await Promise.all([
    listLabTeams(service).catch(() => []),
    getCompetitions(),
    user ? service.from("profiles").select("full_name").eq("id", user.id).maybeSingle() : null,
    preview ? findTeamIds(service, preview) : Promise.resolve([]),
  ])

  let previewEntries: ActivityEntry[] | null = []
  if (previewIds.length) {
    previewEntries = await getActivityForTeams(service, previewIds, { now, viewerUserId: null, viewAsLeader: true }).catch(
      () => null,
    )
  }

  const email = user?.email ?? ""
  const fullName = profileResult?.data?.full_name && !profileResult.data.full_name.includes("@") ? profileResult.data.full_name : "Admin Uji"
  const defaults: LabDefaults = {
    competitionSlug: "olimpiade-engineering",
    teamName: `TEST ${fullName.split(/\s+/)[0]} ${new Date(now).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}`,
    school: "SMA Uji Coba ITB Insight",
    members: [
      { name: fullName, email },
      { name: "Anggota Uji Satu", email: plusAlias(email, "oe1") },
      { name: "Anggota Uji Dua", email: "" },
    ],
  }

  return (
    <>
      <PageHeader
        title="Competition (test lab)"
        subtitle="Uji tim hasil impor dan anggota bayangan. Semua aksi di sini hanya menyentuh tim uji (source = test)."
      />

      <CompetitionLab
        competitions={catalog.filter((c) => c.registrationType === "team").map((c) => ({ slug: c.slug.current, title: c.title }))}
        defaults={defaults}
        teams={teams}
        adminEmail={email}
      />

      <section id="preview" className={labStyles.preview}>
        <div className={labStyles.panel}>
          <h2 className={labStyles.panelTitle}>3. Pratinjau kartu dashboard tim mana pun</h2>
          <p className={labStyles.hint}>
            Kode tim (mis. OE-ABC123) atau email anggota. Ditampilkan seperti yang dilihat ketua tim, tanpa tombol aksi.
          </p>
          <form className={labStyles.previewForm} method="get">
            <input
              className={labStyles.input}
              name="preview"
              defaultValue={preview}
              placeholder="OE-ABC123 atau email@contoh.com"
              aria-label="Kode tim atau email"
            />
            <button type="submit" className={labStyles.primary}>
              Tampilkan
            </button>
          </form>

          {preview &&
            (previewIds.length ? (
              <div className={labStyles.previewStage}>
                <ActivityCard entries={previewEntries} preview />
              </div>
            ) : (
              <p className={labStyles.hint}>Tidak ada tim untuk &quot;{preview}&quot;.</p>
            ))}
        </div>
      </section>
    </>
  )
}
