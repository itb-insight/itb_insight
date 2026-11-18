import { notFound } from "next/navigation"

import AdminShellHifi, { AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import PanelHifi from "@/features/admin-hifi/PanelHifi"
import RingChartHifi from "@/features/admin-hifi/RingChartHifi"
import FeedbackHifi from "@/features/admin-hifi/FeedbackHifi"

export const metadata = {
  title: "Admin Web (hi-fi) | ITB Insight",
  description: "Preview sementara halaman admin Web versi hi-fi.",
}

const FEEDBACK_CONTOH = [
  { rating: 5, comment: "Gacorrrr", time: "14.10" },
  { rating: 4, comment: "Keren banget", time: "09.54" },
  { rating: 3, comment: "Antrian masuknya lama", time: "13.29" },
  { rating: 5, comment: "WOWWWW KEREN BANGET", time: "17.00" },
  { rating: 2, comment: "Susah nyari staffnya pas makan siang", time: "11.47" },
  { rating: 3, comment: "Ada dispenser ga ya", time: "14.30" },
  { rating: 5, comment: "Keren!!!!", time: "08.25" },
  { rating: 3, comment: "Bingung signage gatenya", time: "15.49" },
]

export default function AdminWebHifiPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <AdminShellHifi
      title="Web"
      subtitle="Traffic website"
      activeHref="/admin/web"
      meta={
        <>
          <AdminPill dot>Diperbarui 12 detik lalu</AdminPill>
          <AdminPill>Webdev + Admin</AdminPill>
        </>
      }
    >
      <PanelHifi title="Rangkuman" subtitle="Contoh kepala panel — isi widget menyusul">
        <div style={{ height: 120, display: "grid", placeItems: "center", color: "#ACC7FF" }}>
          Rangkuman (4 kartu) — lane 3
        </div>
      </PanelHifi>

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
        items={FEEDBACK_CONTOH}
        remaining={83}
        moreHref="/admin/feedback"
      />
    </AdminShellHifi>
  )
}
