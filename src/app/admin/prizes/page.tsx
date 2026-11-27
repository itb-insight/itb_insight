import { notFound, redirect } from "next/navigation"

import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import PrizeDesk, { type PrizeTier } from "@/features/arcade-ops/PrizeDesk"
import { getAdminAccess } from "@/lib/admin-access"
import { createClient, createServiceClient } from "@/lib/supabase/server"

import styles from "../booth-access/page.module.css"

export const dynamic = "force-dynamic"
export const metadata = { title: "Meja Hadiah | ITB Insight Admin", robots: { index: false, follow: false } }

// Insight Arcade prize desk (Booth Entre): admins and arcade_duties prize_desk (outside (admin-only)).
export default async function PrizesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/prizes")
  const access = await getAdminAccess(user)
  if (!access.prizeDesk) notFound()

  const service = createServiceClient()
  const [{ data: tierRows }, { data: claimRows }] = await Promise.all([
    service.from("reward_tiers").select("id, tier_number, reward_name, total_stock").gte("tier_number", 101).order("tier_number"),
    service.from("reward_claims").select("tier_id"),
  ])
  const counts = new Map<string, number>()
  for (const c of (claimRows ?? []) as Array<{ tier_id: string }>) counts.set(c.tier_id, (counts.get(c.tier_id) ?? 0) + 1)
  const tiers: PrizeTier[] = ((tierRows ?? []) as Array<{ id: string; tier_number: number; reward_name: string; total_stock: number | null }>).map(
    (t) => ({ tier: String(t.tier_number), name: t.reward_name, stock: t.total_stock, claimed: counts.get(t.id) ?? 0 }),
  )

  return (
    <>
      <PageHeader title="Meja Hadiah" subtitle="Scan QR pengunjung lalu serahkan hadiahnya. Satu hadiah per jenis per orang." />
      <div className={styles.body}>
        <PrizeDesk tiers={tiers} />
      </div>
    </>
  )
}
