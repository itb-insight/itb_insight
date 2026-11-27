import styles from "./RatingStarsHifi.module.css"

/*
  Bentuk bintang yang sama dengan FeedbackPanel (halaman /feedback), digambar
  16px tanpa garis tepi. Kotak 56 dengan tinta 46.67 x 44.39 — tinta mengisi
  83% kotak, cocok dengan dump admin (13.14 / 16 = 82%).
*/
const STAR_PATH =
  "M23.34 0 L28.84 16.95 L46.67 16.95 L32.25 27.43 L37.76 44.39 " +
  "L23.34 33.91 L8.91 44.39 L14.42 27.43 L0 16.95 L17.83 16.95 Z"

interface RatingStarsHifiProps {
  /** 0–5. Dibulatkan dan dibatasi saat digambar. */
  value: number
}

/** Lima bintang 16px, jarak 4. Figma: "Bintang list". */
export default function RatingStarsHifi({ value }: RatingStarsHifiProps) {
  const terisi = Math.max(0, Math.min(5, Math.round(value)))

  return (
    <div className={styles.stars} role="img" aria-label={`${terisi} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={styles.star}
          width="16"
          height="16"
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <path
            transform="translate(4.67 5.83)"
            d={STAR_PATH}
            fill={n <= terisi ? "var(--admin-star-on)" : "var(--admin-star-off)"}
          />
        </svg>
      ))}
    </div>
  )
}
