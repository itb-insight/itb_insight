import { notFound } from "next/navigation"

import RewardsMobile from "@/features/quest/RewardsMobile"
import QuestPageShell from "@/features/quest/QuestPageShell"
import type { RewardEntry, TierEntry } from "@/features/quest/RewardsMobile"

export const metadata = {
  title: "Rewards | ITB Insight",
  description: "Tukar poin quest ITB Insight.",
  robots: { index: false, follow: false },
}

/* Isi contoh, disalin apa adanya dari dump Figma 2114:21381. */
const TIERS: TierEntry[] = [
  {
    state: "unlocked",
    status: "Unlocked",
    name: "BRONZE",
    points: "500 points",
    perk: "[PERK DETAIL\nbisa 2 baris]",
  },
  {
    state: "next",
    status: "252 to unlock",
    name: "SILVER",
    points: "1.500 points",
    perk: "[PERK DETAIL\nbs 2 baris]",
  },
  {
    state: "locked",
    status: "1.752 to unlock",
    name: "GOLD",
    points: "3.000 points",
    perk: "[PERK DETAIL\nbs 2 baris]",
  },
]

const REWARDS: RewardEntry[] = [
  {
    badge: "MERCH",
    name: "20% off ITB Insight Tshirt",
    sub: "Merch desk . 34 left",
    state: "beli",
    action: "300 pts",
  },
  {
    badge: "MERCH",
    name: "Sticker Pack",
    sub: "Merch desk . 120 left",
    state: "beli",
    action: "100 pts",
  },
  {
    badge: "SPON",
    sponsor: true,
    name: "[SPONSOR A] prize",
    sub: "Booth [A3] . 12 left",
    state: "beli",
    action: "400 pts",
  },
  {
    badge: "SPON",
    sponsor: true,
    name: "[SPONSOR B] prize",
    sub: "Booth [B3] . Out of stock",
    state: "habis",
    action: "Sold Out",
  },
  {
    badge: "SPON",
    sponsor: true,
    name: "[SPONSOR D] prize",
    sub: "Booth [C1] . 5 left",
    state: "kurang",
    action: "Need 260",
  },
]

export default function RewardsPage() {
  /*
    Masih memakai data contoh, jadi tetap digerbang walau route-nya sudah
    route sungguhan: isi palsu tidak boleh ikut ke produksi. Hapus baris ini
    begitu halamannya membaca data asli.
  */
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <QuestPageShell activeTab="rewards">
      <RewardsMobile
        wallet={{ spend: "648", lifetime: "1,248" }}
        claim={{
          status: "READY TO CLAIM . VALID 04:52",
          name: "ITB Insight Sticker Pack",
          note: "Show QR to merch-desk staff. Points are taken once they confirm.",
          action: "Show QR",
        }}
        historyHref="/quest/history"
        tiers={TIERS}
        rewards={REWARDS}
        youAre={{
          rank: "#37",
          title: "Door prize for Top 3 on the leaderboard",
          note: "Winner announced at 18:00 on the mainstage. Bring your student card or ID for verification.",
        }}
      />
    </QuestPageShell>
  )
}
