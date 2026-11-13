import Image from "next/image"
import Link from "next/link"
import styles from "./FooterHifi.module.css"

type FooterLink = { label: string; href: string }

/*
 * Tautan event, urut sesuai halaman /event. Event yang punya halaman
 * detail menaut ke /event/<slug>; yang belum (Insight Festival, Alumni
 * Gathering) menaut ke section-nya di /event (id section = slug di
 * src/features/events/data.ts). Ditulis di sini, bukan diimpor dari data
 * event, karena footer juga dipakai di komponen klien (ErrorLayout) dan
 * data event bersifat server-only.
 */
const eventLinks: FooterLink[] = [
  { label: "Insight Festival", href: "/event#insight-festival" },
  { label: "Tech-Xhibition", href: "/event/tech-xhibition" },
  { label: "Playtech & Showtech", href: "/event/playtech-showtech" },
  { label: "Technology Seminar", href: "/event/technology-seminar" },
  { label: "Insight on Stage", href: "/event/insight-on-stage" },
  { label: "Inspirates", href: "/event/inspirates" },
  { label: "Alumni Gathering", href: "/event#alumni-gathering" },
]

/** links kosong = kolom masih placeholder ("Page"). */
const columns: { header: string; href: string; links?: FooterLink[] }[] = [
  { header: "Event", href: "/event", links: eventLinks },
  { header: "Competition", href: "/competition" },
  { header: "Map", href: "/event-map" },
]

const socials = [
  { href: "https://instagram.com/insightitb", label: "Instagram", icon: "/images/icons/InstagramLogo.svg" },
  { href: "https://twitter.com/insightitb", label: "X", icon: "/images/icons/XLogo.svg" },
  //{ href: "https://youtube.com/@insightitb", label: "Youtube", icon: "/images/icons/YoutubeLogo.svg" },
  { href: "https://www.tiktok.com/@itb_insight", label: "TikTok", icon: "/images/icons/TiktokLogo.svg" },
]

export default function FooterHifi() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            <Image
              src="/images/logoitbinsightfooter.png"
              alt="ITB Insight Logo"
              fill
              className={styles.logoImg}
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.itb}>ITB</span>
            <span className={styles.insight}>INSIGHT</span>
            <span className={styles.year}>2026</span>
          </div>
        </div>

        <div className={styles.columns}>
          {columns.map(({ header, links }) => (
            <div key={header} className={styles.column}>
              <p className={styles.columnHeader}>{header}</p>
              {links
                ? links.map(({ label, href }) => (
                    <Link key={href} href={href} className={styles.columnLink}>
                      {label}
                    </Link>
                  ))
                : [1, 2, 3, 4].map((i) => (
                    <Link key={i} href="#" className={styles.columnLink}>
                      Page
                    </Link>
                  ))}
            </div>
          ))}
        </div>

        <div className={styles.socials}>
          {socials.map(({ href, label, icon }) => (
            <Link
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={label}
              className={styles.socialLink}
            >
              <img src={icon} alt="" className={styles.socialIcon} />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
