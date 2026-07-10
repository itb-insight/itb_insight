import Image from "next/image"
import Link from "next/link"
import styles from "./Footer.module.css"

const socials = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://twitter.com", label: "Twitter" },
  { href: "https://youtube.com", label: "Youtube" },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Image
          src="/images/logo.png"
          alt="Insight ITB Logo"
          width={48}
          height={48}
        />
        <p className={styles.name}>INSIGHT ITB</p>
        <div className={styles.socials}>
          {socials.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={styles.socialLink}
            >
              <Image
                src="/images/media-social.png"
                alt={label}
                width={24}
                height={24}
              />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}