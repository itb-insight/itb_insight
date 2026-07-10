import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"
import styles from "./Navbar.module.css"

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
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
          <Link href="/map" className={styles.navLink}>Map</Link>
          <Link href="/event" className={styles.navLink}>Event</Link>
          <Link href="/competition" className={styles.navLink}>Competition</Link>
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