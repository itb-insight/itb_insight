"use client"

import clsx from "clsx"
import { useState } from "react"
import type { FormEvent } from "react"

import SegmentBar from "./SegmentBar"
import styles from "./quest.module.css"
import type { EasterEgg, QuestCollection } from "./types"

interface SecretCodeCardProps {
  onUnlock?: (code: string) => void
}

export function SecretCodeCard({ onUnlock }: SecretCodeCardProps) {
  const [code, setCode] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    onUnlock?.(trimmed)
    setCode("")
  }

  return (
    <section className={styles.secret} aria-labelledby="secret-code-title">
      <h2 id="secret-code-title" className={styles.secretTitle}>
        Found something hidden?
      </h2>
      <p className={styles.secretText}>
        Easter-egg codes are hidden around campus, on the site and on the big screen. Each code works for a limited number
        of people.
      </p>
      <form className={styles.secretRow} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter secret code"
          aria-label="Secret code"
          autoComplete="off"
        />
        <button type="submit" className={styles.lightButton} disabled={!code.trim()}>
          Unlock
        </button>
      </form>
      <p className={styles.scanLink}>
        <span>or</span>
        <span>scan a hidden QR</span>
      </p>
    </section>
  )
}

const numberFormat = new Intl.NumberFormat("en-US")

export function CollectionCard({ collection }: { collection: QuestCollection }) {
  return (
    <article className={styles.collection}>
      <div className={styles.collectionHead}>
        <h3 style={{ margin: 0, font: "inherit" }}>{collection.title}</h3>
        <span className={styles.reward}>+{numberFormat.format(collection.reward)}</span>
      </div>
      <p className={styles.collectionDesc}>{collection.description}</p>
      <div className={styles.collectionBar}>
        <SegmentBar filled={collection.segments.filled} total={collection.segments.total} />
        <span className={styles.collectionCount}>
          {collection.progress}/{collection.total}
        </span>
      </div>
    </article>
  )
}

export function EasterEggCard({ egg }: { egg: EasterEgg }) {
  if (egg.found) {
    return (
      <article className={styles.egg}>
        <span className={styles.eggBadge}>Found</span>
        <h3 className={styles.eggTitle}>{egg.title}</h3>
        <p className={styles.eggMeta}>{egg.source}</p>
        <p className={styles.eggReward}>{egg.reward}</p>
      </article>
    )
  }

  return (
    <article className={clsx(styles.egg, styles.eggUnknown)}>
      <span className={clsx(styles.eggBadge, styles.eggBadgeUnknown)}>???</span>
      <h3 className={styles.eggTitle}>{egg.title}</h3>
      <p className={clsx(styles.eggMeta, styles.eggHint)}>{egg.hint}</p>
    </article>
  )
}

interface SideQuestSectionProps {
  collections: QuestCollection[]
  eggs: EasterEgg[]
  onUnlock?: (code: string) => void
}

export default function SideQuestSection({ collections, eggs, onUnlock }: SideQuestSectionProps) {
  return (
    <>
      <SecretCodeCard onUnlock={onUnlock} />
      <h2 className={styles.sectionLabel}>Collections</h2>
      <div className={styles.collections}>
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
      <h2 className={styles.sectionLabel} style={{ marginTop: 13 }}>
        Easter eggs
      </h2>
      <div className={styles.eggs}>
        {eggs.map((egg) => (
          <EasterEggCard key={egg.id} egg={egg} />
        ))}
      </div>
    </>
  )
}
