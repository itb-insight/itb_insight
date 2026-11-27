import { notFound } from "next/navigation"

import AdminShellHifi, { AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import RatingBarsHifi from "@/features/admin-hifi/RatingBarsHifi"
import FeedbackTableHifi from "@/features/admin-hifi/FeedbackTableHifi"

export const metadata = {
  title: "Feedback | ITB Insight Admin",
  robots: { index: false, follow: false },
}

/* Rancangan ini cuma punya TIGA kartu rangkuman, bukan empat seperti halaman lain. */
const RANGKUMAN = [
  { title: "Rating", value: "4.4/5", caption: "Semua objek terpilih" },
  { title: "Jumlah Feedback", value: "1.286", caption: "Booth 902, event 311, competition 73" },
  { title: "Response Rate", value: "27%", caption: "Feedback dibagi visitor yang check-in" },
]

/* Isi contoh, disalin apa adanya dari dump Figma 1937:3828. */
const RATING = [
  { label: "Drone Showcase", kategori: "booth" as const, value: 4.8, n: 142 },
  { label: "Business Case", kategori: "competition" as const, value: 4.7, n: 38 },
  { label: "Technology Seminar", kategori: "event" as const, value: 4.6, n: 96 },
  { label: "Booth 1A", kategori: "booth" as const, value: 4.5, n: 88 },
  { label: "Insight on Stage", kategori: "competition" as const, value: 4.3, n: 120 },
  { label: "SAR Drone", kategori: "event" as const, value: 4.1, n: 51 },
  { label: "Booth 2B", kategori: "booth" as const, value: 3.9, n: 51 },
  { label: "Play-Tech", kategori: "event" as const, value: 3.6, n: 19 },
]

/* Dump Figma 1939:3949. */
const BARIS_FEEDBACK = [
  { id: 0, kategori: "competition" as const, objek: "Business Case", bintang: 5, komentar: "Gacorrrr", nama: "Cecep", waktu: "14.10" },
  { id: 1, kategori: "booth" as const, objek: "1A", bintang: 4, komentar: "Keren banget", nama: "Ujang", waktu: "09.54" },
  { id: 2, kategori: "event" as const, objek: "Insight on Stage", bintang: 3, komentar: "Antrian masuknya lama", nama: "Juki", waktu: "13.29" },
  { id: 3, kategori: "booth" as const, objek: "Drone Showcase", bintang: 5, komentar: "WOWWWW KEREN BANGET GOALS MANTAP", nama: "Sukron", waktu: "17.00" },
  { id: 4, kategori: "booth" as const, objek: "2B", bintang: 2, komentar: "Susah nyari staffnya pas makan siang, tolong standby dong", nama: "Ajit", waktu: "11.47" },
]

export default function AdminFeedbackPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <AdminShellHifi
      title="Feedback"
      subtitle="Kepuasan pengunjung terhadap booth, lomba, & acara"
      activeHref="/admin-hifi/feedback"
      meta={
        <>
          <AdminPill dot>Diperbarui 12 detik lalu</AdminPill>
          <AdminPill>Event + Competition + Admin</AdminPill>
        </>
      }
    >
      <SummaryCardsHifi items={RANGKUMAN} />

      <RatingBarsHifi
        title="Rating"
        subtitle="Rata-rata skor bintang"
        items={RATING}
        caption="Dari skala 0 sampai 5"
      />

      <FeedbackTableHifi rows={BARIS_FEEDBACK} />

    </AdminShellHifi>
  )
}
