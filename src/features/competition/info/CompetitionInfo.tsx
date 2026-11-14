import type { CSSProperties } from "react";
import type { Competition } from "@/features/competition/types";
import { anchorId, formatRupiah, whatsappUrl } from "@/features/competition/format";
import styles from "@/features/competition/info/CompetitionInfo.module.css";

/**
 * Detail lomba dari Form Informasi Competition: info singkat, tema/bidang,
 * syarat peserta, dokumen pendaftaran, biaya per gelombang, berkas per tahap.
 *
 * Dipakai di dua tempat:
 *   desktop  di antara timeline dan tombol daftar (CompetitionDesktopLayout)
 *   mobile   di bawah kanvas Figma 393px, sebagai alur biasa (page.tsx),
 *            karena kanvas mobile memakai posisi absolut setinggi tetap
 *
 * showFees: rincian gelombang biaya. Desktop menampilkannya di kartu
 * Registration Fee sendiri, jadi di sana false; kartu mobile terlalu kecil
 * sehingga rinciannya ditaruh di sini.
 *
 * Bagian tanpa data tidak dirender. Server Component, tanpa JavaScript.
 */
export default function CompetitionInfo({
  competition,
  showFees,
  variant,
}: {
  competition: Competition;
  showFees: boolean;
  variant: "desktop" | "mobile";
}) {
  const { info, fees } = competition;
  const titleId = anchorId(`${competition.slug}-detail`, variant);
  const accent = {
    "--accent-from": competition.accentFrom,
    "--accent-to": competition.accentTo,
    // Desktop: ikut membesar bersama bagian lain halaman di layar > 1728px
    // (tan(atan2(a, b)) = a / b sebagai angka murni). Lihat fluid() di
    // CompetitionDesktopLayout. Di layar lebih sempit, skalanya tetap 1.
    ...(variant === "desktop" ? { zoom: "max(1, tan(atan2(100vw, 1728px)))" } : {}),
  } as CSSProperties;

  return (
    <section
      aria-labelledby={titleId}
      className={`${styles.info} ${variant === "mobile" ? styles.mobile : styles.desktop}`}
      style={accent}
    >
      <h2 id={titleId} className={styles.title}>
        Detail Lomba
      </h2>

      <dl className={styles.facts}>
        {info.facts.map((f) => (
          <div key={f.label} className={styles.fact}>
            <dt className={styles.factLabel}>{f.label}</dt>
            <dd className={styles.factValue}>{f.value}</dd>
          </div>
        ))}
      </dl>

      {info.topics ? (
        <div className={styles.card}>
          <h3 className={styles.subTitle}>{info.topics.title}</h3>
          {info.topics.intro ? <p className={styles.text}>{info.topics.intro}</p> : null}
          <ul className={styles.chips}>
            {info.topics.items.map((t) => (
              <li key={t} className={styles.chip}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <h3 className={styles.subTitle}>Syarat peserta</h3>
          <ul className={styles.ticks}>
            {info.requirements.map((r) => (
              <li key={r} className={styles.tick}>
                {r}
              </li>
            ))}
          </ul>
        </div>
        {info.documents?.length ? (
          <div className={styles.card}>
            <h3 className={styles.subTitle}>Yang perlu disiapkan</h3>
            <ul className={styles.ticks}>
              {info.documents.map((d) => (
                <li key={d} className={styles.tick}>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {showFees && fees.length > 1 ? (
        <div className={styles.card}>
          <h3 className={styles.subTitle}>Biaya pendaftaran</h3>
          <FeeTiers competition={competition} />
        </div>
      ) : null}

      {info.stageFiles?.length ? (
        <div className={styles.card}>
          <h3 className={styles.subTitle}>Berkas per tahap</h3>
          <ol className={styles.stages}>
            {info.stageFiles.map((s) => (
              <li key={`${s.stage}-${s.files}`} className={styles.stage}>
                <span className={styles.stageName}>{s.stage}</span>
                <span className={styles.stageFiles}>{s.files}</span>
                <span className={styles.stageDeadline}>{s.deadline}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {info.contacts?.length ? (
        <div id={anchorId("kontak", variant)} className={`${styles.card} ${styles.anchor}`}>
          <h3 className={styles.subTitle}>Kontak</h3>
          <ul className={styles.contacts}>
            {info.contacts.map((c) => (
              <li key={c.name} className={styles.contact}>
                <span className={styles.contactName}>{c.name}</span>
                {c.whatsapp ? (
                  <a
                    href={whatsappUrl(c.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.contactLink}
                  >
                    WhatsApp {c.whatsapp}
                  </a>
                ) : null}
                {c.line ? (
                  <a
                    href={`https://line.me/ti/p/~${c.line}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.contactLink}
                  >
                    LINE {c.line}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/** Rincian gelombang biaya. Juga dipakai kartu Registration Fee desktop. */
export function FeeTiers({ competition }: { competition: Competition }) {
  return (
    <ol className={styles.tiers}>
      {competition.fees.map((f) => (
        <li key={f.label ?? f.amount} className={styles.tier}>
          <span className={styles.tierLabel}>{f.label}</span>
          <span className={styles.tierAmount}>{formatRupiah(f.amount)}</span>
          <span className={styles.tierMeta}>
            {[f.unit, f.periodLabel].filter(Boolean).join(" · ")}
          </span>
        </li>
      ))}
    </ol>
  );
}
