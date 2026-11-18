import type { Metadata } from "next"
import { notFound } from "next/navigation"

import DDayWidgetsPreview from "@/features/admin/components/DDayWidgetsPreview/DDayWidgetsPreview"

export const metadata: Metadata = {
  title: "Preview widget D-Day | ITB Insight Admin",
  robots: { index: false, follow: false },
}

/**
 * Preview sementara widget Line Chart + Heatmap /admin/d-day dengan data dummy.
 * Sengaja di luar /admin supaya bisa dicek di lokal tanpa akun admin; mati di production.
 * Hapus begitu halaman /admin/d-day memakai widget ini dengan data asli.
 */
export default function AdminWidgetPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  return <DDayWidgetsPreview />
}
