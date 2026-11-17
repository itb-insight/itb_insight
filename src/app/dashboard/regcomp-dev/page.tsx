import { notFound } from "next/navigation"
import CompetitionPicker from "@/features/dashboard/CompetitionPicker"
import { getCompetitions } from "@/lib/competitions"

export default async function RegisterCompetitionPage() {
  // Preview/dev page: not served in production (tests/guardrails/dev-routes.test.ts).
  if (process.env.NODE_ENV === "production") notFound()
  const competitions = await getCompetitions()
  return <CompetitionPicker competitions={competitions} />
}
