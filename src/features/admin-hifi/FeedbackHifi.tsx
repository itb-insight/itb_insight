import { Fragment } from "react"
import Link from "next/link"

import PanelHifi from "./PanelHifi"
import RatingStarsHifi from "./RatingStarsHifi"
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
                <RatingStarsHifi value={item.rating} />
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
