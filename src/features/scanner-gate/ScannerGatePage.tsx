import ScannerBackground from "./ScannerBackground"
import styles from "./ScannerGatePage.module.css"

interface ScannerGatePageProps {
  boothName?: string
  pointsNote?: string
  visitorCount?: string
  pointsGiven?: string
}

export default function ScannerGatePage({
  boothName = "Booth: Drone Showcase",
  pointsNote = "50 points per visitor, staff: Ghea",
  visitorCount = "00000",
  pointsGiven = "00000",
}: ScannerGatePageProps) {
  return (
    <div className={styles.page}>
      <ScannerBackground />

      <div className={styles.content}>
        <h1 className={styles.title}>{boothName}</h1>
        <p className={styles.subtitle}>{pointsNote}</p>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Visitor hari ini</span>
            <span className={styles.statValue}>{visitorCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Points diberikan</span>
            <span className={styles.statValue}>{pointsGiven}</span>
          </div>
        </div>

        <div className={styles.scanner}>
          <div className={styles.viewport}>
            <span className={`${styles.corner} ${styles.cornerTopLeft}`} />
            <span className={`${styles.corner} ${styles.cornerTopRight}`} />
            <span className={`${styles.corner} ${styles.cornerBottomLeft}`} />
            <span className={`${styles.corner} ${styles.cornerBottomRight}`} />
          </div>
          <p className={styles.caption}>Arahkan ke profil QR visitor</p>
        </div>
      </div>
    </div>
  )
}
