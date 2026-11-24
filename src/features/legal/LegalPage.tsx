import Link from "next/link"
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi"
import styles from "./LegalPage.module.css"

export const LEGAL_CONTACT_EMAIL = "itbinsight26@gmail.com"
export const LEGAL_LAST_UPDATED = "24 November 2026"

type LegalPageProps = {
  title: string
  /** The other legal page, linked under the title. */
  sibling: { href: string; label: string }
  children: React.ReactNode
}

/** Shell for the static legal pages (/privacy, /terms): navbar, readable column, footer. */
export default function LegalPage({ title, sibling, children }: LegalPageProps) {
  return (
    <>
      <NavbarHifi />
      <main className={styles.page}>
        <article className={styles.article}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>ITB Insight</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.meta}>
              Last updated: {LEGAL_LAST_UPDATED} · See also{" "}
              <Link href={sibling.href}>{sibling.label}</Link>
            </p>
          </header>
          <div className={styles.body}>{children}</div>
        </article>
      </main>
      <FooterHifi />
    </>
  )
}
