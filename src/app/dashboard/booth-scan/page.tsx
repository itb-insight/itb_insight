import { redirect } from "next/navigation"

import { BOOTH_SECTION_PATH } from "@/lib/admin-nav"

// Retired with Insight Arcade (migration 0030): booth staff scan at /admin/booth.
export default function BoothScanPage() {
  redirect(BOOTH_SECTION_PATH)
}
