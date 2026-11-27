import { notFound, redirect } from "next/navigation"

import PageHeader from "@/features/admin/components/PageHeader/PageHeader"
import ReviewQueue, { type ReviewItem } from "@/features/arcade-ops/ReviewQueue"
import { getAdminAccess } from "@/lib/admin-access"
import { getArcadeBoard } from "@/lib/arcade"
import { createClient, createServiceClient } from "@/lib/supabase/server"

import styles from "../booth-access/page.module.css"

export const dynamic = "force-dynamic"
const LIMIT = 80
export const metadata = { title: "Review Arcade | ITB Insight Admin", robots: { index: false, follow: false } }

// Insight Arcade proof review: admins and arcade_duties reviewers (outside (admin-only)).
export default async function ArcadeReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/arcade-review")
  const access = await getAdminAccess(user)
  if (!access.reviewer) notFound()

  const service = createServiceClient()
  const [{ data }, board] = await Promise.all([
    service
      .from("sidequest_submissions")
      .select(
        "id, user_id, status, points_awarded, handle, proof_path, proof_url, proof_sha256, submitted_at, sidequests(title, points, needs_handle), drone_soccer_teams(name), profiles!sidequest_submissions_user_id_fkey(full_name)",
      )
      .eq("source", "proof")
      .eq("review_state", "unreviewed")
      .order("submitted_at", { ascending: true })
      .limit(LIMIT + 1),
    getArcadeBoard(),
  ])

  type Row = {
    id: string
    user_id: string
    status: string
    points_awarded: number
    handle: string | null
    proof_path: string | null
    proof_url: string | null
    proof_sha256: string | null
    submitted_at: string
    sidequests: { title: string; points: number; needs_handle: string | null } | null
    drone_soccer_teams: { name: string } | null
    profiles: { full_name: string | null } | null
  }
  const all = (data ?? []) as unknown as Row[]
  const more = all.length > LIMIT
  const rows = all.slice(0, LIMIT)
  const rank = new Map(board.entries.map((e) => [e.userId, e.rank]))

  const hashes = [...new Set(rows.map((r) => r.proof_sha256).filter((h): h is string => Boolean(h)))]
  const dupCount = new Map<string, number>()
  if (hashes.length > 0) {
    const { data: same } = await service.from("sidequest_submissions").select("proof_sha256, user_id").in("proof_sha256", hashes)
    for (const r of (same ?? []) as Array<{ proof_sha256: string; user_id: string }>) {
      dupCount.set(r.proof_sha256, (dupCount.get(r.proof_sha256) ?? 0) + 1)
    }
  }

  const paths = rows.map((r) => r.proof_path).filter((p): p is string => Boolean(p))
  const signed = new Map<string, string>()
  if (paths.length > 0) {
    const { data: urls } = await service.storage.from("arcade-proofs").createSignedUrls(paths, 900)
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl)
  }

  const items: ReviewItem[] = rows
    .map((r) => ({
      id: r.id,
      name: r.profiles?.full_name?.trim() || "Pengunjung",
      rank: rank.get(r.user_id) ?? null,
      quest: r.sidequests?.title ?? "Quest",
      points: r.status === "approved" ? r.points_awarded : (r.sidequests?.points ?? 0),
      pending: r.status === "pending",
      handle: r.handle,
      platform: r.sidequests?.needs_handle ?? null,
      vote: r.drone_soccer_teams?.name ?? null,
      imageUrl: r.proof_path ? (signed.get(r.proof_path) ?? null) : null,
      linkUrl: r.proof_url?.startsWith("https://") ? r.proof_url : null,
      duplicate: (dupCount.get(r.proof_sha256 ?? "") ?? 0) > 1,
      submittedAt: r.submitted_at,
    }))
    .sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9))

  return (
    <>
      <PageHeader title="Review Insight Arcade" subtitle="Periksa bukti link dan foto side quest. Pemain peringkat atas didahulukan." />
      <div className={styles.body}>
        <ReviewQueue items={items} more={more} />
      </div>
    </>
  )
}
