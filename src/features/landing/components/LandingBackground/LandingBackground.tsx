import styles from "./LandingBackground.module.css"

// Page-level backdrop: blobs positioned by absolute page Y-coordinate so a
// single shape can bleed across section boundaries (e.g. Hero -> About)
// without being clipped by any one section's own overflow/sticky box.
// Sits behind everything as the first child of <main>.
export default function LandingBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <img src="/images/bg-landing/green-blob-about.svg" alt="" className={styles.greenBlob} />
      <img src="/images/bg-landing/purple-blob-about.svg" alt="" className={styles.purpleBlob} />

      {/* Stats section */}
      <img src="/images/bg-landing/object1-stats.svg" alt="" className={styles.statsObject1} />
      <img src="/images/bg-landing/object2-stats.svg" alt="" className={styles.statsObject2} />
      <img src="/images/bg-landing/object3-stats.svg" alt="" className={styles.statsObject3} />

      {/* Stretches from Stats down through Timeline */}
      <img src="/images/bg-landing/yellow-blob-stats.svg" alt="" className={styles.yellowBlob} />

      {/* Gallery section */}
      <img src="/images/bg-landing/bg-gallery.svg" alt="" className={styles.galleryBg} />

      {/* Timeline section */}
      <img src="/images/bg-landing/bg-timeline.svg" alt="" className={styles.timelineBg} />

      {/* Stretches from Timeline into Media Partners */}
      <img src="/images/bg-landing/gradient-blob.svg" alt="" className={styles.gradientBlob} />

      {/* Media Partners section */}
      <img src="/images/bg-landing/yellowish-blob.svg" alt="" className={styles.yellowishBlob} />
    </div>
  )
}
