
export type StaffLocationKind = "gate" | "booth"

export interface StaffScanRow {
  id: string
  name: string
  role: string
  totalScan: number
  totalPoints: number
  lastScan: string | null
}

export interface StaffScanGroup {
  id: string
  label: string
  kind: StaffLocationKind
  totalScan: number
  totalPoints: number
  staff: StaffScanRow[]
}

export type TeamRegistrationStatus = "registered" | "withdrawn" | "awaiting_payment" | "expired"

export interface TeamRegistrationRow {
  id: number | string
  competition: string
  competitionLabel: string
  teamName: string | null
  members: string[]
  status: TeamRegistrationStatus
  registeredAt: string | Date
}

export interface CompetitionOption {
  value: string
  label: string
}
