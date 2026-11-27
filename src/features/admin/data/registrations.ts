import "server-only"

import { selectAll } from "./query"
import type { RegistrationRowDto, RegistrationsDto, RegistrationStatusKey } from "./types"

type One<T> = T | T[] | null | undefined
const one = <T,>(value: One<T>): T | null => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null))

type RawRegistration = {
  id: string
  registration_kind: "individual" | "team"
  status: string
  submitted_at: string
  competitions: One<{ slug: string; name: string }>
  profiles: One<{ full_name: string | null }>
  competition_teams: One<{
    team_uid: string | null
    team_name: string | null
    status: string | null
    withdrawn_at: string | null
    competition_team_members: Array<{ name: string | null; status: string | null; member_role: string | null }> | null
  }>
  payments: Array<{ status: string }> | null
}

/**
 * One status per registration, as the admin reads it:
 *   - withdrawn: the team withdrew;
 *   - registered: a payment settled, or the committee verified it (imported and free entries);
 *   - awaiting_payment: a payment is pending, or none was started yet;
 *   - expired: every payment attempt failed, expired or was cancelled.
 * Payment states come only from the Midtrans webhook (and manual entries for imports).
 */
export function registrationStatus(input: {
  status: string
  teamStatus?: string | null
  teamWithdrawnAt?: string | null
  payments: string[]
}): RegistrationStatusKey {
  if (input.teamStatus === "withdrawn" || input.teamWithdrawnAt) return "withdrawn"
  if (input.payments.includes("paid") || input.status === "verified") return "registered"
  if (input.payments.includes("pending") || input.payments.length === 0) return "awaiting_payment"
  return "expired"
}

const SELECT = `
  id,
  registration_kind,
  status,
  submitted_at,
  competitions(slug, name),
  profiles(full_name),
  competition_teams(team_uid, team_name, status, withdrawn_at, competition_team_members(name, status, member_role)),
  payments(status)
`

export function toRegistrationRow(raw: RawRegistration): RegistrationRowDto {
  const competition = one(raw.competitions)
  const team = one(raw.competition_teams)
  const profile = one(raw.profiles)

  const members = team
    ? (team.competition_team_members ?? [])
        // Imported form rows use "-" for an empty slot.
        .filter((member) => member.status !== "withdrawn" && member.name && !/^[\s\p{P}]*$/u.test(member.name))
        // Leader first, then the rest in the order they came.
        .sort((a, b) => Number(b.member_role === "leader") - Number(a.member_role === "leader"))
        .map((member) => String(member.name))
    : profile?.full_name
      ? [profile.full_name]
      : []

  return {
    id: team?.team_uid ?? raw.id.slice(0, 8),
    competition: competition?.slug ?? "",
    competition_label: competition?.name ?? "—",
    name: team?.team_name ?? profile?.full_name ?? null,
    members,
    status: registrationStatus({
      status: raw.status,
      teamStatus: team?.status,
      teamWithdrawnAt: team?.withdrawn_at,
      payments: (raw.payments ?? []).map((payment) => payment.status),
    }),
    registered_at: raw.submitted_at,
  }
}

/** Every competition registration (team and individual), newest first. null when the query fails. */
export async function getRegistrations(): Promise<RegistrationsDto | null> {
  try {
    const raw = await selectAll<RawRegistration>((supabase) =>
      supabase
        .from("competition_registrations")
        .select(SELECT)
        .order("submitted_at", { ascending: false })
        .order("id"),
    )
    const rows = raw.map(toRegistrationRow)

    const competitions = new Map<string, string>()
    for (const row of rows) if (row.competition) competitions.set(row.competition, row.competition_label)

    const counts: Record<RegistrationStatusKey, number> = { registered: 0, withdrawn: 0, awaiting_payment: 0, expired: 0 }
    for (const row of rows) counts[row.status] += 1

    return {
      rows,
      competitions: [...competitions].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)),
      counts,
    }
  } catch (err) {
    console.error("[admin registrations] query failed:", err instanceof Error ? err.message : err)
    return null
  }
}
