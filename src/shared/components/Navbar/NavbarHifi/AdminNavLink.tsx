"use client"

import Link from "next/link"

import { useAdminLink } from "@/shared/hooks/useAdminLink"

// "Admin" in the header, only for users with an admin surface (src/lib/admin-nav.ts).
export default function AdminNavLink({ className, onClick }: { className?: string; onClick?: () => void }) {
  const href = useAdminLink()
  if (!href) return null

  return (
    <Link href={href} className={className} onClick={onClick}>
      Admin
    </Link>
  )
}
