import { notFound } from "next/navigation"

import AdminShellHifi, { AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import FeedbackHifi from "@/features/admin-hifi/FeedbackHifi"
import RingChartHifi from "@/features/admin-hifi/RingChartHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import WidgetRowHifi from "@/features/admin-hifi/WidgetRowHifi"

import { Engagement, JumlahPengunjung } from "./SponsorWidgets"

export const metadata = {
  title: "Sponsor | ITB Insight Admin",
  robots: { index: false, follow: false },
}

const RANGKUMAN = [
  { title: "Logo Impressions", value: "48.200", caption: "logo Anda tampil di layar visitor" },
  { title: "Map Hotspot Dibuka", value: "18.340", caption: "kartu profil di peta interaktif" },
  { title: "Total Kunjungan Situs", value: "61.500", caption: "seluruh ITB Insight, dari PostHog" },
  { title: "Click-Through Rate", value: "2,4%", caption: "1.140 klik dari 48.200 impressions" },
]

const FEEDBACK = [
  { rating: 5, comment: "Gacorrrr", time: "14.10" },
  { rating: 4, comment: "Keren banget", time: "09.54" },
  { rating: 3, comment: "Antrian masuknya lama", time: "13.29" },
  { rating: 5, comment: "WOWWWW KEREN BANGET", time: "17.00" },
  { rating: 2, comment: "Susah nyari staffnya pas makan siang", time: "11.47" },
  { rating: 3, comment: "Ada dispenser ga ya", time: "14.30" },
  { rating: 5, comment: "Keren!!!!", time: "08.25" },
  { rating: 3, comment: "Bingung signage gatenya", time: "15.49" },
]

export default function AdminSponsorPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <AdminShellHifi
      title="Nama Sponsor"
      subtitle="Jangkauan brand dan booth Anda di ITB Insight 2026"
      activeHref="/admin-hifi/sponsor"
      meta={
        <>
          <AdminPill dot>Diperbarui 12 detik lalu</AdminPill>
          <AdminPill>Unduh laporan</AdminPill>
          <AdminPill>Scan QR</AdminPill>
        </>
      }
    >
      <SummaryCardsHifi items={RANGKUMAN} />

      <Engagement />

      <JumlahPengunjung />

      <WidgetRowHifi columns="1fr 1fr">
        <RingChartHifi
          title="Persentase Pengunjung Booth"
          subtitle="Jumlah pengunjung booth dari semua pengunjung"
          value={25}
          centerLabel="Mengunjungi Booth"
          legend={{ on: "Mengunjungi", off: "Tidak Mengunjungi" }}
          total="Total Pengunjung: 3709"
        />
        <FeedbackHifi
          title="Feedback"
          subtitle="Feedback anonim setelah scan QR booth"
          average={4.5}
          items={FEEDBACK}
          remaining={83}
          moreHref="/admin-hifi/feedback"
        />
      </WidgetRowHifi>
    </AdminShellHifi>
  )
}
