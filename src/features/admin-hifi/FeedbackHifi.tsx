import { Fragment } from "react"
import Link from "next/link"

import PanelHifi from "./PanelHifi"
import styles from "./FeedbackHifi.module.css"

export interface FeedbackItemHifi {
  rating: number
  comment: string
  time: string
}

interface FeedbackHifiProps {
  title: string
  subtitle?: string
  average: number
  items: FeedbackItemHifi[]
  remaining?: number
  moreHref?: string
}

export default function FeedbackHifi({
  title,
  subtitle,
  average,
  items,
  remaining,
  moreHref,
}: FeedbackHifiProps) {
  const averageLabel = average.toFixed(1).replace(".", ",")

  return (
    <PanelHifi
      title={title}
      subtitle={subtitle}
      action={<p className={styles.average}>{averageLabel}</p>}
    >
      <div className={styles.root}>
        {items.length === 0 ? (
          <p className={styles.empty}>Belum ada feedback yang masuk.</p>
        ) : (
          <div className={styles.table}>
            {items.map((item, i) => (
              <Fragment key={i}>
                <RatingStars value={item.rating} />
                <p className={styles.comment} title={item.comment}>
                  {item.comment}
                </p>
                <p className={styles.time}>{item.time}</p>
              </Fragment>
            ))}
          </div>
        )}

        {moreHref && remaining ? (
          <Link href={moreHref} className={styles.more}>
            Lihat {remaining} feedback lainnya
          </Link>
        ) : null}
      </div>
    </PanelHifi>
  )
}

const STAR_PATH =
  "M23.34 0 L28.84 16.95 L46.67 16.95 L32.25 27.43 L37.76 44.39 " +
  "L23.34 33.91 L8.91 44.39 L14.42 27.43 L0 16.95 L17.83 16.95 Z"

function RatingStars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)))

  return (
    <div className={styles.stars} role="img" aria-label={`${filled} dari 5 bintang`}>
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
            fill={n <= filled ? "var(--admin-star-on)" : "var(--admin-star-off)"}
          />
        </svg>
      ))}
    </div>
  )
}
