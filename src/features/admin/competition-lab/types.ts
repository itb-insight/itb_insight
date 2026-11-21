/** A test team as the admin lab lists it (src/lib/competition-lab.ts). */
export type LabTeam = {
  id: string
  teamUid: string
  teamName: string
  status: string
  competitionName: string
  createdAt: string
  members: Array<{ slot: number | null; role: string; name: string; claimEmail: string | null; claimed: boolean; status: string }>
}
