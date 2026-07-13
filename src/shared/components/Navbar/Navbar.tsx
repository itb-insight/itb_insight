import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"
import styles from "./Navbar.module.css"

interface NavbarProps {
  isSolid?: boolean;
}

export default function Navbar({ isSolid = false }: NavbarProps) {
  const navbarClassName = `${styles.navbar} ${isSolid ? styles.isSolid : ""}`;

  return (
    <nav className={navbarClassName}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logo.png"
            alt="Insight ITB Logo"
            width={48}
            height={48}
            priority
          />
        </Link>

        <div className={styles.navLinks}>
          <Link href="/event-map" className={styles.navLink}>Map</Link>
          <Link href="/event" className={styles.navLink}>Event</Link>
          <Link href="/competition1" className={styles.navLink}>Competition</Link>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.searchBtn} aria-label="Search">
          <Search size={20} />
        </button>
        <Link href="/login" className={styles.logInBtn}>Log In</Link>
        <Link href="/register" className={styles.signUpBtn}>Sign up</Link>
      </div>
    </nav>
  )
}