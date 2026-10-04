import CompetitionPicker from "@/features/dashboard/CompetitionPicker"
import { getCompetitions } from "@/lib/competitions"

export default async function RegisterCompetitionPage() {
  const competitions = await getCompetitions()
  return <CompetitionPicker competitions={competitions} />
}
