import { notFound } from "next/navigation"

import PointsHistoryMobile from "@/features/quest/PointsHistoryMobile"
import QuestPageShell from "@/features/quest/QuestPageShell"
import type { HistoryEntry } from "@/features/quest/PointsHistoryMobile"

export const metadata = {
  title: "Points History | ITB Insight",
  description: "Riwayat poin quest ITB Insight.",
  robots: { index: false, follow: false },
}

/* Isi contoh, disalin apa adanya dari dump Figma 2124:21846. */
const ENTRIES: HistoryEntry[] = [
  {
    time: "13:42",
    name: "[Points Name Detail]",
    detail: "[Redeem location] . [Detail]",
    status: "pending",
    amount: "+80",
    source: "W+L",
  },
  {
    time: "13:42",
    name: "[Points Name Detail]",
    detail: "[Redeem location] . [Detail]",
    status: "redeemed",
    amount: "-100",
    source: "Wallet",
  },
  {
    time: "13:42",
    name: "[Points Name Detail]",
    detail: "[Redeem location] . [Detail]",
    status: "verified",
    amount: "+180",
    source: "W+L",
  },
  {
    time: "13:42",
    name: "[Points Name Detail]",
    detail: "[Redeem location] . [Detail]",
    status: "review",
    amount: "+30",
    source: "W+L",
  },
  {
    time: "13:42",
    name: "[Points Name Detail]",
    detail: "[Redeem location] . [Detail]",
    status: "voided",
    amount: "0",
    source: "-",
  },
  {
    time: "13:42",
    name: "[Points Name Detail]",
    detail: "[Redeem location] . [Detail]",
    status: "manual",
    amount: "+100",
    source: "W+L",
  },
]

export default function PointsHistoryPage() {
  /*
    Masih memakai data contoh, jadi tetap digerbang walau route-nya sudah
    route sungguhan: isi palsu tidak boleh ikut ke produksi. Hapus baris ini
    begitu halamannya membaca data asli.
  */
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <QuestPageShell>
      <PointsHistoryMobile
        filters={[
          { label: "All", active: true },
          { label: "Earned" },
          { label: "Spent" },
          { label: "Issues 1" },
        ]}
        entries={ENTRIES}
        reference="REF - U-0913837e"
        referenceNote="Show this reference code to help desk at [LOCATION] if points are missing even after syncing."
      />
    </QuestPageShell>
  )
}
