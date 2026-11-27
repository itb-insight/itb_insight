import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import QuestHeader from "@/features/quest/QuestHeader"
import QuestHowToPlay from "@/features/quest/QuestHowToPlay"
import QuestMap from "@/features/quest/QuestMap"
import QuestMobileHeader from "@/features/quest/QuestMobileHeader"
import QuestSignInButton from "@/features/quest/QuestSignInButton"
import shared from "@/features/quest/quest-shared.module.css"
import styles from "./page.module.css"

export const metadata = {
  title: "Preview komponen quest | ITB Insight",
  description: "Preview komponen Section 2 halaman Quest.",
  robots: { index: false },
}

/*
 * Preview Section 2 halaman Quest (Figma). Hanya untuk development.
 * ?frame=header | mheader | howto | map | signin menampilkan satu frame saja
 * di pojok kiri atas, seukuran frame Figma-nya, untuk dibandingkan per piksel.
 */

const FRAMES = ["header", "mheader", "howto", "map", "signin"] as const
type Frame = (typeof FRAMES)[number]

function DesktopHeaders() {
  return (
    <div className={`${styles.desktop} ${shared.frameBg}`}>
      <div className={styles.headerRow} style={{ top: 11 }}>
        <QuestHeader state="signedOut" uid="qh-out" />
      </div>
      <div className={styles.headerRow} style={{ top: 216 }}>
        <QuestHeader state="signedIn" uid="qh-in" />
      </div>
      <div className={styles.headerRow} style={{ top: 421 }}>
        <QuestHeader state="flash" uid="qh-flash" />
      </div>
    </div>
  )
}

function MobileHeader() {
  return (
    <div className={`${styles.phone} ${shared.frameBg}`}>
      <QuestMobileHeader uid="qmh" />
    </div>
  )
}

function HowToPlay() {
  return (
    <div className={styles.phone}>
      <QuestHowToPlay />
    </div>
  )
}

function MapFrame() {
  return (
    <div className={styles.phone}>
      <QuestMap />
    </div>
  )
}

function SignIn() {
  return (
    <div className={styles.signIn}>
      <QuestSignInButton />
    </div>
  )
}

const RENDER: Record<Frame, () => ReactNode> = {
  header: DesktopHeaders,
  mheader: MobileHeader,
  howto: HowToPlay,
  map: MapFrame,
  signin: SignIn,
}

export default async function QuestPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ frame?: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()

  const { frame } = await searchParams
  if (frame && (FRAMES as readonly string[]).includes(frame)) {
    const Only = RENDER[frame as Frame]
    return (
      <main className={styles.single}>
        <Only />
      </main>
    )
  }

  return (
    <main className={styles.board}>
      <section>
        <h2 className={styles.label}>Header Quest (desktop)</h2>
        <DesktopHeaders />
      </section>
      <section className={styles.mobileRow}>
        <div>
          <h2 className={styles.label}>mobile header</h2>
          <MobileHeader />
        </div>
        <div>
          <h2 className={styles.label}>How to play</h2>
          <HowToPlay />
        </div>
        <div>
          <h2 className={styles.label}>Quest Map Layer</h2>
          <MapFrame />
        </div>
        <div>
          <h2 className={styles.label}>Sign in</h2>
          <SignIn />
        </div>
      </section>
    </main>
  )
}
