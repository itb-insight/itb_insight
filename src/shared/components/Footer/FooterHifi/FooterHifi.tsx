import Image from "next/image"
import Link from "next/link"
import styles from "./FooterHifi.module.css"

const columns = [
  { header: "Event", href: "/event" },
  { header: "Competition", href: "/competition" },
  { header: "Map", href: "/event-map" },
]

const socials = [
  { href: "https://instagram.com/insightitb", label: "Instagram", icon: "/images/icons/InstagramLogo.svg" },
  { href: "https://twitter.com/insightitb", label: "X", icon: "/images/icons/XLogo.svg" },
  { href: "#", label: "LinkedIn", icon: "/images/icons/LinkedinLogo.svg" },
  { href: "https://youtube.com/@insightitb", label: "Youtube", icon: "/images/icons/YoutubeLogo.svg" },
  { href: "#", label: "TikTok", icon: "/images/icons/TiktokLogo.svg" },
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
          {columns.map(({ header }) => (
            <div key={header} className={styles.column}>
              <p className={styles.columnHeader}>{header}</p>
              {[1, 2, 3, 4].map((i) => (
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
