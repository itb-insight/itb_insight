import { redirect } from "next/navigation"

import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import QrPointsTester from "@/features/admin/qr-points/QrPointsTester"
import { isAdminUser } from "@/lib/admin"
import { getActiveBooths } from "@/lib/booths"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "QR Points (test) | ITB Insight Admin",
  robots: { index: false, follow: false },
}

// TEMPORARY: manual test bench for the booth points flow (scan personal QR -> confirm -> award).
// Gated here because /admin itself has no auth yet; the API re-checks the role on every call.
export default async function QrPointsPage() {
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

  const booths = await getActiveBooths()

  return (
    <>
      <PageHeader
        title="QR Points (test)"
        subtitle="Scan QR profil pengunjung, konfirmasi, lalu poin dicatat. Halaman uji sementara."
      />
      <QrPointsTester booths={booths.map((b) => ({ id: b.id, name: b.name }))} />
    </>
  )
}
