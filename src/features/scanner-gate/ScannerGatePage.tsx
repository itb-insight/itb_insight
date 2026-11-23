import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi"
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
// Berkasnya kebetulan ada di folder competition, tapi isinya generik: persis
// frame "Header Mobile" 393x99 di dump ini. Lebih pas kalau nanti dipindah ke
// shared/components, tapi itu menyentuh halaman competition, jadi dibiarkan.
import MobileHeader from "@/features/competition/MobileHeader"
import CameraFeed from "./CameraFeed"
import ScannerBackground from "./ScannerBackground"
import styles from "./ScannerGatePage.module.css"

interface ScannerGatePageProps {
  boothName?: string
  pointsNote?: string
  visitorCount?: string
  pointsGiven?: string
  /** Diteruskan ke CameraFeed; dipanggil tiap QR terbaca. */
  onDecode?: (text: string) => void
}

export default function ScannerGatePage({
  boothName = "Booth: Drone Showcase",
  pointsNote = "50 points per visitor, staff: Ghea",
  visitorCount = "00000",
  pointsGiven = "00000",
  onDecode,
}: ScannerGatePageProps) {
  return (
    <>
      {/*
        Navbar situs, hanya di layar lebar. Varian solid dipakai karena tautan
        NavbarHifi berwarna #CCDDFF — dibuat untuk latar gelap — sementara
        halaman ini latarnya terang; tanpa bar navy di belakangnya, tulisannya
        nyaris tak terlihat.

        Ditaruh di luar .page karena .page sekarang overflow:hidden; navbar yang
        position:fixed lebih aman di luar wadah itu.
      */}
      <div className={styles.navDesktop}>
        <NavbarHifi isSolid />
      </div>

      <div className={styles.page}>
        {/* Latar dan isi dibungkus bersama: hiasan latarnya memakai persentase
            terhadap pembungkus ini, jadi dia harus ikut dibatasi lebarnya. */}
        <div className={styles.shell}>
          <ScannerBackground />

          {/* Header versi mobile dari dump; diganti NavbarHifi di layar lebar. */}
          <div className={styles.navMobile}>
            <MobileHeader />
          </div>

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
                <CameraFeed onDecode={onDecode} />

                <span className={`${styles.corner} ${styles.cornerTopLeft}`} />
                <span className={`${styles.corner} ${styles.cornerTopRight}`} />
                <span className={`${styles.corner} ${styles.cornerBottomLeft}`} />
                <span className={`${styles.corner} ${styles.cornerBottomRight}`} />
              </div>
              <p className={styles.caption}>Arahkan ke profil QR visitor</p>
            </div>
          </div>
        </div>

        {/* Di luar .shell supaya selebar layar penuh. Di HP tidak ada bedanya
            (kolomnya memang selebar layar); di laptop, footer selebar 393 yang
            menggantung di tengah halaman terang terlihat seperti salah pasang. */}
        <FooterHifi />
      </div>
    </>
  )
}

