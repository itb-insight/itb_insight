import { notFound, redirect } from "next/navigation"

import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import QrPointsTester from "@/features/admin/qr-points/QrPointsTester"
import { isAdminUser } from "@/lib/admin"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "QR Points (test) | ITB Insight Admin",
  robots: { index: false, follow: false },
}

// TEMPORARY: manual test bench for the old booth points flow (scan personal QR -> confirm -> award).
// Admin-only ((admin-only)/layout.tsx); the check below stays as a second gate. The API re-checks the role.
// Off in production since Insight Arcade went live: it wrote real points (and its API now answers 410).
export default async function QrPointsPage() {
  if (process.env.NODE_ENV === "production") notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (!(await isAdminUser(user))) {
    return (
      <>
        <PageHeader title="QR Points (test)" />
        <p style={{ padding: "var(--space-8)", color: "var(--color-text-secondary)" }}>
          Halaman ini hanya untuk admin. Set <code>profiles.role_a = &apos;admin&apos;</code> pada akunmu.
        </p>
      </>
    )
  }

  // Optional for this test page: every booth, active or not. No booth = manual admin award.
  const { data: booths } = await createServiceClient()
    .from("booths")
    .select("id, name, is_active")
    .order("name", { ascending: true })

  return (
    <>
      <PageHeader
        title="QR Points (test)"
        subtitle="Scan QR profil pengunjung, konfirmasi, lalu poin dicatat. Halaman uji sementara."
      />
      <QrPointsTester
        booths={(booths ?? []).map((b) => ({ id: b.id as string, name: b.is_active ? b.name : `${b.name} (nonaktif)` }))}
      />
    </>
  )
}
