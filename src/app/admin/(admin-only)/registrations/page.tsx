import { AdminPageHifi, AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import BelumAdaHifi from "@/features/admin-hifi/BelumAdaHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import TeamRegistrationTable from "@/features/dashboard-tables/TeamRegistrationTable"
import { count } from "@/features/admin/components/Insights/format"
import { getRegistrations } from "@/features/admin/data/adapters"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "User | ITB Insight Admin",
  robots: { index: false, follow: false },
}

/** User (Figma): competition registrations and their payment status, from Supabase. */
export default async function AdminRegistrationsPage() {
  const data = await getRegistrations()

  return (
    <AdminPageHifi
      title="User"
      subtitle="Pendaftaran tim dan kehadiran finalis"
      meta={<AdminPill dot={data !== null}>{data ? "Live · Supabase" : "Database tidak tersedia"}</AdminPill>}
    >
      {data ? (
        <>
          <SummaryCardsHifi
            items={[
              {
                title: "Terdaftar (lunas)",
                value: count(data.counts.registered),
                caption: `Dari ${data.competitions.length} mata lomba`,
              },
              {
                title: "Menunggu pembayaran",
                value: count(data.counts.awaiting_payment),
                caption: "Pembayaran pending atau belum dimulai",
              },
              {
                title: "Mengundurkan diri",
                value: count(data.counts.withdrawn),
                caption: `Kadaluwarsa / gagal bayar: ${count(data.counts.expired)}`,
              },
              { title: "Finalis hadir hari-H", value: "—", caption: "Belum ada data finalis" },
            ]}
          />

          <TeamRegistrationTable
            rows={data.rows.map((row) => ({
              id: row.id,
              competition: row.competition,
              competitionLabel: row.competition_label,
              teamName: row.name,
              members: row.members,
              status: row.status,
              registeredAt: row.registered_at,
            }))}
            competitions={data.competitions}
            memberHandles={false}
            pageSize={50}
            title="Berapa banyak tim yang sudah daftar, dan statusnya"
            subtitle="Status pembayaran dari webhook Midtrans (impor Google Form: lunas manual)"
          />
        </>
      ) : (
        <BelumAdaHifi
          title="Pendaftaran"
          label="Tidak tersedia"
          catatan="Query pendaftaran ke Supabase gagal. Coba muat ulang; kalau masih gagal, cek log server."
        />
      )}

      <BelumAdaHifi
        title="Kehadiran finalis"
        subtitle="Tim dengan minimal 1 anggota check-in di hari-H"
        label="Belum ada sumber data"
        catatan="Database belum menandai tim mana yang finalis. Setelah ada penanda finalis per tim, tabel ini bisa dihitung dari gate_check_ins anggotanya."
      />
    </AdminPageHifi>
  )
}
