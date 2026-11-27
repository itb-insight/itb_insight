"use client"

import { useSecondsSince } from "@/features/admin/components/Live/useSecondsSince"
import { AdminPill } from "@/layouts/AdminShellHifi/AdminPageHeader"

/** "Diperbarui 12 detik lalu". Its own leaf: the ticking re-renders only this pill. */
export default function UpdatedAgoPill({ at, failed }: { at: string; failed: boolean }) {
  const seconds = useSecondsSince(at)
  const ago = seconds < 60 ? `${seconds} detik` : `${Math.floor(seconds / 60)} menit`

  return (
    <AdminPill dot>
      <span role="status">
        Diperbarui {ago} lalu{failed ? " · gagal memuat, mencoba lagi" : ""}
      </span>
    </AdminPill>
  )
}
