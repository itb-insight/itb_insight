import { AdminPageHifi, AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import BelumAdaHifi from "@/features/admin-hifi/BelumAdaHifi"
import FeedbackTableHifi from "@/features/admin-hifi/FeedbackTableHifi"
import RatingBarsHifi from "@/features/admin-hifi/RatingBarsHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import { count, percent, stampLabel } from "@/features/admin/components/Insights/format"
import { FEEDBACK_ROW_LIMIT, getFeedbackInsights } from "@/features/admin/data/adapters"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Feedback | ITB Insight Admin",
  robots: { index: false, follow: false },
}

const rating = (value: number) => value.toFixed(1).replace(".", ",")

/** Feedback (Figma 1937:3828, 1939:3949): every feedback form's responses, from Supabase. */
export default async function AdminFeedbackPage() {
  const data = await getFeedbackInsights()

  if (!data) {
    return (
      <AdminPageHifi
        title="Feedback"
        subtitle="Kepuasan pengunjung terhadap booth, lomba, & acara"
        meta={<AdminPill>Database tidak tersedia</AdminPill>}
      >
        <BelumAdaHifi
          title="Feedback"
          label="Tidak tersedia"
          catatan="Query feedback ke Supabase gagal. Coba muat ulang; kalau masih gagal, cek log server."
        />
      </AdminPageHifi>
    )
  }

  const { by_category: by } = data
  const responseRate = data.checked_in > 0 ? data.responded_attendees / data.checked_in : null

  return (
    <AdminPageHifi
      title="Feedback"
      subtitle="Kepuasan pengunjung terhadap booth, lomba, & acara"
      meta={
        <>
          <AdminPill dot>Live · Supabase</AdminPill>
          <AdminPill>Semua form feedback</AdminPill>
        </>
      }
    >
      <SummaryCardsHifi
        items={[
          {
            title: "Rating",
            value: data.average === null ? "—" : `${rating(data.average)}/5`,
            caption: "Rating keseluruhan, semua form",
          },
          {
            title: "Jumlah Feedback",
            value: count(data.total),
            caption: `Booth ${count(by.booth)}, event ${count(by.event)}, competition ${count(by.competition)}`,
          },
          {
            title: "Response Rate",
            value: responseRate === null ? "—" : percent(responseRate, 0),
            caption:
              responseRate === null
                ? "Belum ada visitor yang check-in"
                : `${count(data.responded_attendees)} dari ${count(data.checked_in)} visitor check-in`,
          },
        ]}
      />

      {data.ratings.length > 0 ? (
        <RatingBarsHifi
          title="Rating"
          subtitle="Rata-rata skor per form dan pertanyaan"
          items={data.ratings.map((item) => ({ label: item.label, kategori: item.category, value: item.value, n: item.n }))}
          caption="Skala 0 sampai 5; pertanyaan skala lain disetarakan ke 5"
        />
      ) : (
        <BelumAdaHifi title="Rating" label="Belum ada rating" catatan="Belum ada jawaban bintang atau skala yang masuk." />
      )}

      <FeedbackTableHifi
        pageSize={50}
        title={data.total > FEEDBACK_ROW_LIMIT ? `Semua Feedback (${count(FEEDBACK_ROW_LIMIT)} terbaru)` : "Semua Feedback"}
        rows={data.rows.map((row) => ({
          id: row.id,
          kategori: row.category,
          objek: row.subject,
          bintang: row.stars,
          komentar: row.comment || "—",
          nama: row.name,
          waktu: stampLabel(row.created_at),
        }))}
      />
    </AdminPageHifi>
  )
}
