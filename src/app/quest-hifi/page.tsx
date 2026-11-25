import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import QuestHeaderHifi from "@/features/quest-hifi/QuestHeaderHifi"
import QuestHowToPlayHifi from "@/features/quest-hifi/QuestHowToPlayHifi"
import QuestMapHifi from "@/features/quest-hifi/QuestMapHifi"
import QuestMobileHeaderHifi from "@/features/quest-hifi/QuestMobileHeaderHifi"
import QuestSignInButtonHifi from "@/features/quest-hifi/QuestSignInButtonHifi"
import shared from "@/features/quest-hifi/quest-shared.module.css"
import styles from "./page.module.css"

export const metadata = {
  title: "Quest (hi-fi) | ITB Insight",
  description: "Preview sementara Section 2 halaman Quest versi hi-fi.",
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
        <QuestHeaderHifi state="signedOut" uid="qh-out" />
      </div>
      <div className={styles.headerRow} style={{ top: 216 }}>
        <QuestHeaderHifi state="signedIn" uid="qh-in" />
      </div>
      <div className={styles.headerRow} style={{ top: 421 }}>
        <QuestHeaderHifi state="flash" uid="qh-flash" />
      </div>
    </div>
  )
}

function MobileHeader() {
  return (
    <div className={`${styles.phone} ${shared.frameBg}`}>
      <QuestMobileHeaderHifi uid="qmh" />
    </div>
  )
}

function HowToPlay() {
  return (
    <div className={styles.phone}>
      <QuestHowToPlayHifi />
    </div>
  )
}

function MapFrame() {
  return (
    <div className={styles.phone}>
      <QuestMapHifi />
    </div>
  )
}

function SignIn() {
  return (
    <div className={styles.signIn}>
      <QuestSignInButtonHifi />
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

export default async function QuestHifiPage({
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
