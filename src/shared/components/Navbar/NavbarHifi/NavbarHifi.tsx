import Image from "next/image"
import Link from "next/link"

import { isCountdownOnly } from "@/lib/countdown"
import styles from "./NavbarHifi.module.css"
import NavAuthActionsHifi from "./NavAuthActionsHifi"
import MobileMenuHifi from "./MobileMenuHifi"
import NavbarShell from "./NavbarShell"

interface NavbarHifiProps {
  isSolid?: boolean;
  /** Latar biru solid hanya di lebar layar mobile (dipakai dashboard, selaras dengan dropdown-nya) */
  solidOnMobile?: boolean;
}

export default function NavbarHifi({ isSolid = false, solidOnMobile = false }: NavbarHifiProps) {
  const navbarClassName = `${styles.navbar} ${isSolid ? styles.isSolid : ""} ${
    solidOnMobile ? styles.solidOnMobile : ""
  }`;

  // COUNTDOWN_ONLY=true: only the feedback form and login are reachable, so drop the links that
  // would land on the countdown page. Read on the server; in a client tree (error.tsx) it is false.
  const countdownOnly = isCountdownOnly();

  return (
    <NavbarShell className={navbarClassName} scrolledClassName={styles.scrolled}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logoinsight-hifi.png"
            alt="ITB Insight Logo"
            width={62}
            height={61}
            priority
          />
        </Link>

        {countdownOnly ? null : (
          <div className={styles.navLinks}>
            <Link href="/event" className={styles.navLink}>Event</Link>
            <Link href="/competition" className={styles.navLink}>Competition</Link>
            <Link href="/event-map" className={styles.navLink}>Map</Link>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {countdownOnly ? null : (
          <button className={styles.searchBtn} aria-label="Search">
            <img src="/images/icons/search-icon.svg" alt="" className={styles.searchIcon} />
          </button>
        )}
        <NavAuthActionsHifi hideDashboard={countdownOnly} />
      </div>

      <MobileMenuHifi countdownOnly={countdownOnly} />
    </NavbarShell>
  )
}
