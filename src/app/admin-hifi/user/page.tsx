import { notFound } from "next/navigation"

import AdminShellHifi, { AdminPill } from "@/layouts/AdminShellHifi/AdminShellHifi"
import SummaryCardsHifi from "@/features/admin-hifi/SummaryCardsHifi"
import TeamRegistrationTable from "@/features/dashboard-tables/TeamRegistrationTable"
import FinalisTable from "@/features/dashboard-tables/FinalisTable"
import {
  mockCompetitionOptions,
  mockFinalisRows,
  mockTeamRegistrations,
} from "@/features/dashboard-tables/mock"

export const metadata = {
  title: "User | ITB Insight Admin",
  robots: { index: false, follow: false },
}

const RANGKUMAN = [
  { title: "Tim terdaftar (lunas)", value: "128", caption: "Dari 4 mata lomba" },
  { title: "Menunggu pembayaran", value: "17", caption: "Link bayar bisa dikirim ulang" },
  { title: "Mengundurkan diri", value: "4", caption: "Termasuk yang kadaluarsa: 2" },
  { title: "Finalis hadir hari-H", value: "3/8", caption: "Tim dengan minimal 1 anggota check in" },
]

export default function AdminUserPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <AdminShellHifi
      /*
        Kepala halaman di rancangannya tertulis "Web / Traffic website", padahal
        menu yang tersorot "User" dan isinya data pendaftaran tim — jelas salah
        salin di berkas desain. Dipakai judul yang sesuai isinya.
      */
      title="User"
      subtitle="Pendaftaran tim dan kehadiran finalis"
      activeHref="/admin-hifi/user"
      meta={
        <>
          <AdminPill dot>Diperbarui 12 detik lalu</AdminPill>
          <AdminPill>Webdev + Admin</AdminPill>
        </>
      }
    >
      <SummaryCardsHifi items={RANGKUMAN} />

      <TeamRegistrationTable
        rows={mockTeamRegistrations}
        competitions={mockCompetitionOptions}
        title="Berapa banyak tim yang sudah daftar, dan statusnya"
        subtitle="Status pembayaran hanya dari webhook midtrans"
      />

      <FinalisTable rows={mockFinalisRows} />

    </AdminShellHifi>
  )
}
