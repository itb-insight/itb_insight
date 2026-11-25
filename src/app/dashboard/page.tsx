import { redirect } from "next/navigation"

import type { ActivityEntry } from "@/features/home/activityTypes"
import HomePage from "@/features/home/HomePage"
import { claimPendingSlots } from "@/lib/competition-claims"
import { buildAgenda } from "@/lib/dashboard-agenda"
import { getActivityForUser } from "@/lib/dashboard-activity"
import { createClient, createServiceClient } from "@/lib/supabase/server"

// The countdown corrects itself against the server's clock, so the timestamp handed to
// it has to be the time of this request — not whenever the page was last built.
export const dynamic = "force-dynamic"

/** "Siti Aisyah Putri" → "Siti"; an email-as-name (the sign-up default) → its local part. */
function firstName(fullName: string | null | undefined) {
  const name = (fullName ?? "").trim()
  if (!name) return ""
  return name.includes("@") ? name.split("@")[0] : name.split(/\s+/)[0]
}

export default async function DashboardPage() {
  const now = Date.now()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard")

  const service = createServiceClient()

  // Sign-ins by typed code skip /auth/callback, and older sessions never went through it:
  // claiming here makes sure an imported team shows up the first time the dashboard opens.
  // It runs first because it may also fill in the profile name read below.
  await claimPendingSlots(service, user).catch((error) => console.error("Slot claim failed:", error))

  const [activity, { data: profile }] = await Promise.all([
    getActivityForUser(service, user.id, now).catch((error): ActivityEntry[] | null => {
      console.error("Dashboard activity failed to load:", error)
      return null
    }),
    service.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ])
  const name = firstName(profile?.full_name ?? (user.user_metadata?.full_name as string | undefined))
  // A withdrawn team's competition dates no longer concern the user.
  const agenda = await buildAgenda((activity ?? []).filter((entry) => !entry.withdrawn).map((entry) => entry.competitionSlug))

  return <HomePage serverNow={now} userName={name} activity={activity} agenda={agenda} />
}
