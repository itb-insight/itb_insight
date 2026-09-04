import Image from "next/image"
import Link from "next/link"
import styles from "./NavbarHifi.module.css"
import NavAuthActionsHifi from "./NavAuthActionsHifi"

interface NavbarHifiProps {
  isSolid?: boolean;
}

export default function NavbarHifi({ isSolid = false }: NavbarHifiProps) {
  const navbarClassName = `${styles.navbar} ${isSolid ? styles.isSolid : ""}`;

  return (
    <nav className={navbarClassName}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logoinsight-hifi.png"
            alt="ITB Insight Logo"
            width={56}
            height={55}
            priority
          />
        </Link>

        <div className={styles.navLinks}>
          <Link href="/event" className={styles.navLink}>Event</Link>
          <Link href="/competition1" className={styles.navLink}>Competition</Link>
          <Link href="/event-map" className={styles.navLink}>Map</Link>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.searchBtn} aria-label="Search">
          <img src="/images/icons/search-icon.svg" alt="" className={styles.searchIcon} />
        </button>
        <NavAuthActionsHifi />
      </div>
    </nav>
  )
}
