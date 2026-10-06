import Image from "next/image"
import styles from "./DashboardBackground.module.css"

const DECOR_1 = "/deco/decor1.png"
const DECOR_2 = "/deco/decor2.png"
const DECOR_3 = "/deco/decor3.png"
const DECOR_4 = "/deco/decor4.png"

// Decorative background shared by every dashboard route. Absolutely positioned behind
// the shell's content, so the parent must be `position: relative; isolation: isolate`.
export default function DashboardBackground() {
  return (
    <div className={styles.decorLayer} aria-hidden="true">
      <div className={`${styles.decor1} ${styles.desktopOnly}`}>
        <Image src={DECOR_1} alt="" fill sizes="50vw" style={{ objectFit: "contain" }} />
      </div>
      <div className={`${styles.decor2} ${styles.desktopOnly}`}>
        <Image src={DECOR_2} alt="" fill sizes="100vw" style={{ objectFit: "contain" }} />
      </div>
      <div className={`${styles.mDecor3} ${styles.mobileOnly}`}>
        <Image src={DECOR_3} alt="" fill sizes="260px" style={{ objectFit: "contain" }} />
      </div>
      <div className={`${styles.mDecor1a} ${styles.mobileOnly}`}>
        <Image src={DECOR_1} alt="" fill sizes="640px" style={{ objectFit: "contain" }} />
      </div>
      <div className={`${styles.mDecor4} ${styles.mobileOnly}`}>
        <Image src={DECOR_4} alt="" fill sizes="360px" style={{ objectFit: "contain" }} />
      </div>
      <div className={`${styles.mDecor1b} ${styles.mobileOnly}`}>
        <Image src={DECOR_1} alt="" fill sizes="640px" style={{ objectFit: "contain" }} />
      </div>
    </div>
  )
}
