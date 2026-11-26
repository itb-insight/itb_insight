import Link from "next/link"

import shared from "./quest-shared.module.css"
import styles from "./QuestSignInButtonHifi.module.css"

/*
 * Figma: halaman "Quest" > Section 2 > "Group 48096272" (2104:285).
 * Tombol "Sign in" 128 x 40 tanpa isi, hanya tepi.
 */

export default function QuestSignInButtonHifi({ href = "/login" }: { href?: string }) {
  return (
    <Link href={href} className={`${styles.button} ${shared.stroke}`}>
      Sign in
    </Link>
  )
}
