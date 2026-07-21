import Link from "next/link"

import type { RegistrationRow } from "@/lib/registrations"
import TeamSubmitButton from "./TeamSubmitButton"
import styles from "./Dashboard.module.css"

const statusBadge: Record<string, { className: string; label: string }> = {
  draft: { className: styles.badgeDraft, label: "Draft" },
  submitted: { className: styles.badgeSubmitted, label: "Submitted" },
  verified: { className: styles.badgeVerified, label: "Terverifikasi" },
  rejected: { className: styles.badgeRejected, label: "Ditolak" },
}

export default function DashboardHome({ registrations }: { registrations: RegistrationRow[] }) {
  const submittedCount = registrations.filter((reg) => reg.status === "submitted").length
  const verifiedCount = registrations.filter((reg) => reg.status === "verified").length

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Dashboard Peserta</p>
          <h1 className={styles.title}>Registrasi kompetisi kamu.</h1>
          <p className={styles.subtitle}>
            Buat atau gabung tim, kirim registrasi, dan pantau status verifikasi dari panitia — semuanya di satu tempat.
          </p>
          <div className={styles.btnRow}>
            <Link href="/dashboard/register-competition" className={styles.btnPrimary}>
              Daftar Kompetisi
            </Link>
          </div>
        </header>

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <p className={styles.statValue}>{registrations.length}</p>
            <p className={styles.statLabel}>Registrasi aktif</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>{submittedCount}</p>
            <p className={styles.statLabel}>Menunggu review</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>{verifiedCount}</p>
            <p className={styles.statLabel}>Terverifikasi</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Registrasi Terbaru</h2>

          {registrations.length === 0 ? (
            <div className={styles.empty}>
              <p>Belum ada registrasi. Mulai daftar kompetisi sekarang.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {registrations.map((reg) => {
                const badge = statusBadge[reg.status] || statusBadge.submitted
                const isDraftTeamLeader =
                  reg.registration_kind === "team" && reg.status === "draft" && reg.is_team_leader && reg.team_id
                const submitDisabledReason =
                  isDraftTeamLeader && (reg.team_member_count || 0) < (reg.team_min || 1)
                    ? `Minimal ${reg.team_min || 1} anggota sebelum submit.`
                    : undefined

                return (
                  <article key={reg.id} className={styles.card}>
                    <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>
                    <h3 className={styles.cardTitle}>{reg.team_name}</h3>
                    <p className={styles.meta}>
                      Kompetisi: {reg.competition_name || reg.competition_id}
                    </p>
                    <p className={styles.meta}>
                      Jenis: {reg.registration_kind === "individual" ? "Individu" : "Tim"}
                    </p>
                    {reg.team_uid ? (
                      <p className={styles.meta}>
                        UID Tim: <span className={styles.mono}>{reg.team_uid}</span>
                      </p>
                    ) : null}
                    {reg.registration_kind === "team" ? (
                      <p className={styles.meta}>
                        {reg.team_member_count || 0} anggota
                        {reg.team_min && reg.team_max ? ` (butuh ${reg.team_min}–${reg.team_max})` : ""}
                      </p>
                    ) : null}

                    {isDraftTeamLeader && reg.team_id ? (
                      <TeamSubmitButton teamId={reg.team_id} disabledReason={submitDisabledReason} />
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
