import Link from "next/link"

import type { CompetitionSummary } from "@/lib/competitions"
import IndividualRegisterButton from "./IndividualRegisterButton"
import styles from "./Dashboard.module.css"

export default function CompetitionPicker({ competitions }: { competitions: CompetitionSummary[] }) {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/dashboard" className={styles.backLink}>
            ← Kembali ke Dashboard
          </Link>
          <p className={styles.eyebrow}>Registrasi</p>
          <h1 className={styles.title}>Pilih Kompetisi</h1>
          <p className={styles.subtitle}>
            Kompetisi tim membutuhkan pembuatan atau bergabung ke tim. Kompetisi individu bisa langsung didaftarkan.
          </p>
        </header>

        <section className={styles.grid}>
          {competitions.map((competition) => {
            const slug = competition.slug.current
            const isTeam = competition.registrationType === "team"

            return (
              <article key={competition._id} className={styles.card}>
                <span className={`${styles.badge} ${styles.badgeDraft}`}>
                  {isTeam ? "Tim" : "Individu"}
                </span>
                <h3 className={styles.cardTitle}>{competition.title}</h3>
                <p className={styles.cardText}>
                  {typeof competition.description === "string" ? competition.description : ""}
                </p>
                {isTeam ? (
                  <p className={styles.meta}>
                    {competition.teamMin}–{competition.teamMax} anggota · prefix{" "}
                    <span className={styles.mono}>{competition.teamUidPrefix}</span>
                  </p>
                ) : null}

                {isTeam ? (
                  <div className={styles.btnRow}>
                    <Link href={`/dashboard/teams/create?comp=${slug}`} className={styles.btnPrimary}>
                      Buat Tim
                    </Link>
                    <Link href={`/dashboard/teams/join?comp=${slug}`} className={styles.btnOutline}>
                      Gabung Tim
                    </Link>
                  </div>
                ) : (
                  <IndividualRegisterButton slug={slug} />
                )}
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
