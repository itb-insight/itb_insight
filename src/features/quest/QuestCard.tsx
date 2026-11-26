import clsx from "clsx"
import Link from "next/link"
import type { ReactNode } from "react"

import { CalendarStarIcon, CameraIcon, CheckIcon, ClockIcon, StoreIcon } from "./icons"
import styles from "./quest.module.css"
import type { QuestIconKind, QuestItem, QuestStatus } from "./types"

function renderIcon(kind: QuestIconKind): ReactNode {
  switch (kind) {
    case "store":
      return <StoreIcon />
    case "calendar":
      return <CalendarStarIcon />
    case "clock":
      return <ClockIcon />
    case "camera":
      return <CameraIcon />
    case "check":
      return <CheckIcon />
    default:
      return null
  }
}

const CARD_STATUS_CLASS: Record<QuestStatus, string> = {
  default: styles.cardDefault,
  pending: "",
  review: "",
  done: styles.cardDone,
  locked: styles.cardLocked,
}

const ICON_STATUS_CLASS: Record<QuestStatus, string> = {
  default: "",
  pending: clsx(styles.iconCircle, styles.iconPending),
  review: clsx(styles.iconCircle, styles.iconReview),
  done: clsx(styles.iconCircle, styles.iconDone),
  locked: clsx(styles.iconCircle, styles.iconLocked),
}

interface QuestCardProps {
  quest: QuestItem
  href: string
}

export default function QuestCard({ quest, href }: QuestCardProps) {
  const className = clsx(styles.card, CARD_STATUS_CLASS[quest.status])
  const content = (
    <>
      <span className={clsx(styles.iconBox, ICON_STATUS_CLASS[quest.status])} aria-hidden="true">
        {renderIcon(quest.icon)}
      </span>
      <span className={styles.cardText}>
        <p className={styles.cardTitle}>{quest.title}</p>
        {quest.meta ? <p className={styles.cardMeta}>{quest.meta}</p> : null}
      </span>
      <span className={styles.cardPoints}>+{quest.points}</span>
    </>
  )

  if (quest.status === "locked") {
    return (
      <div className={className} aria-disabled="true">
        {content}
      </div>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}
