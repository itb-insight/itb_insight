import PanelHifi from "@/features/admin-hifi/PanelHifi"
import { ASSUME_IN_AREA_HOURS, EVENT_CLOSE_HOUR, formatNumberId } from "@/features/admin/data/dday"
import type { DDayLiveDto } from "@/features/admin/data/types"
import { formatClock } from "@/features/admin/data/timeRange"

import styles from "./DDay.module.css"

const HOUR_MS = 60 * 60 * 1000

/**
 * "Di area sekarang": the live headcount (admin_dday, migration 0028). A visitor counts for
 * ASSUME_IN_AREA_HOURS after their latest gate check-in / booth scan / presence ping, unless their
 * phone reported leaving after it. After closing time a warning says the figure still includes
 * people who went home without their phone reporting it, and when it will have drained.
 */
export default function LiveVisitorsPanel({ live, afterClose }: { live: DDayLiveDto; afterClose: boolean }) {
  const drainsAt = live.newest_at ? formatClock(new Date(new Date(live.newest_at).getTime() + ASSUME_IN_AREA_HOURS * HOUR_MS)) : null

  return (
    <PanelHifi
      title="Pengunjung di area sekarang"
      subtitle={`Perkiraan: dihitung ${ASSUME_IN_AREA_HOURS} jam sejak sinyal terakhir, kecuali HP-nya melapor sudah keluar area`}
    >
      {afterClose && live.in_area_now > 0 ? (
        <div className={styles.warning} role="status">
          <p className={styles.warningTitle}>Acara sudah selesai ({EVENT_CLOSE_HOUR}.00 WIB): angka ini kemungkinan terlalu tinggi</p>
          <p className={styles.warningText}>
            Pengunjung dianggap masih di area sampai {ASSUME_IN_AREA_HOURS} jam setelah sinyal terakhirnya (scan gate, scan
            booth, atau lokasi HP), kecuali HP-nya melapor sudah keluar area. Kebanyakan pengunjung tidak menyalakan lokasi,
            jadi yang sudah pulang tetap terhitung sampai waktunya habis.
            {drainsAt ? ` Angka ini turun sendiri dan habis paling lambat sekitar pukul ${drainsAt} WIB.` : ""}
          </p>
        </div>
      ) : null}

      <div className={styles.liveRow}>
        <p className={styles.liveNumber} aria-live="polite">
          {formatNumberId(live.in_area_now)}
          <span className={styles.liveUnit}>orang</span>
        </p>

        <dl className={styles.liveStats}>
          <div className={styles.liveStat}>
            <dt>Akun pengunjung</dt>
            <dd>{formatNumberId(live.accounts)}</dd>
          </div>
          <div className={styles.liveStat}>
            <dt>+ yang diwakili</dt>
            <dd>{formatNumberId(live.represented)}</dd>
          </div>
          <div className={styles.liveStat}>
            <dt>Lokasi aktif (5 menit)</dt>
            <dd>{formatNumberId(live.tracked_now)}</dd>
          </div>
          <div className={styles.liveStat}>
            <dt>Sudah keluar (dilaporkan HP)</dt>
            <dd>{formatNumberId(live.left)}</dd>
          </div>
          <div className={styles.liveStat}>
            <dt>Lewat {ASSUME_IN_AREA_HOURS} jam, dianggap pulang</dt>
            <dd>{formatNumberId(live.timed_out)}</dd>
          </div>
        </dl>
      </div>

      <p className={styles.footnote}>
        Rombongan (orang tua, guru) dihitung bersama perwakilannya.
        {live.oldest_at ? ` Sinyal tertua yang masih dihitung: ${formatClock(new Date(live.oldest_at))} WIB.` : ""}
      </p>
    </PanelHifi>
  )
}
