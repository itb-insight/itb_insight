import { notFound } from "next/navigation"

import LeaderboardMobile from "@/features/quest/LeaderboardMobile"

export const metadata = {
  title: "Leaderboard | ITB Insight",
  description: "Papan peringkat quest ITB Insight.",
  robots: { index: false, follow: false },
}

/* Isi contoh, disalin apa adanya dari dump Figma 3429:17434. */
const PODIUM = [
  { initials: "BS", name: "Bima Suryanto", points: "3.910" },
  { initials: "BS", name: "Bima Sulistyo", points: "3.410" },
  { initials: "NT", name: "Najla Triseno", points: "2.980" },
] as const

const BARIS = [
  { rank: 4, name: "Fajar R.", quests: 18, points: "2.940" },
  { rank: 5, name: "Salsa M. F.", quests: 17, points: "2.815" },
  { rank: 6, name: "Yoga Mahsyul", quests: 16, points: "2.700" },
  { rank: 7, name: "Putri Ardhio", quests: 16, points: "2.655" },
  { rank: 8, name: "AQIL", quests: 15, points: "2.510" },
  { rank: 9, name: "Aulia F.", quests: 15, points: "2.480" },
  { rank: 10, name: "Rahmat Wahyudin S. P.", quests: 15, points: "2.470" },
]

/* Setelah pemisah "..." — tetangga peringkatmu. */
const SEKITAR = [
  { rank: 36, name: "Syifa Nurul", quests: 11, points: "1.300" },
  { rank: 38, name: "Putriiiiii", quests: 10, points: "1.215" },
]

export default function QuestLeaderboardPreview() {
  /*
    Masih memakai data contoh, jadi tetap digerbang walau route-nya sudah
    route sungguhan: isi palsu tidak boleh ikut ke produksi. Hapus baris ini
    begitu halamannya membaca data asli.
  */
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <LeaderboardMobile
      podium={[PODIUM[0], PODIUM[1], PODIUM[2]]}
      rows={BARIS}
      nearby={SEKITAR}
      me={{
        rank: 37,
        name: "You . Sachitta P.",
        note: "60 pts behind #38 | 1 quest pending",
        points: "1.248",
      }}
    />
  )
}
