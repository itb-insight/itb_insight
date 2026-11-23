
import type {
  FinalisRow, CompetitionOption, StaffScanGroup, TeamRegistrationRow } from "./types"

export const mockStaffScanGroups: StaffScanGroup[] = [
  {
    id: "gate-a",
    label: "Gate A",
    kind: "gate",
    totalScan: 429,
    totalPoints: 0,
    staff: [
      { id: "beno", name: "Beno", role: "Gate staff", totalScan: 17, totalPoints: 0, lastScan: "0" },
      { id: "tiara", name: "Tiara", role: "Gate staff (backup)", totalScan: 412, totalPoints: 0, lastScan: "0" },
    ],
  },
  {
    id: "booth-drone-showcase",
    label: "Booth: Drone Showcase",
    kind: "booth",
    totalScan: 1240,
    totalPoints: 62000,
    staff: [
      { id: "ghea", name: "Ghea", role: "Booth staff", totalScan: 712, totalPoints: 35600, lastScan: "35.600" },
      { id: "marissa-1", name: "Marissa", role: "Booth staff", totalScan: 528, totalPoints: 26400, lastScan: "26.400" },
    ],
  },
  {
    id: "booth-1a",
    label: "Booth 1A",
    kind: "booth",
    totalScan: 1105,
    totalPoints: 55250,
    staff: [
      { id: "marissa-2", name: "Marissa", role: "Exhibitor", totalScan: 1105, totalPoints: 55250, lastScan: "55.250" },
    ],
  },
]

export const mockCompetitionOptions: CompetitionOption[] = [
  { value: "business-case", label: "Business case" },
  { value: "sar-drone", label: "SAR drone" },
  { value: "robot-competition", label: "Robot competition" },
  { value: "lomba-4", label: "[Lomba 4]" },
]

export const mockTeamRegistrations: TeamRegistrationRow[] = [
  {
    id: 0,
    competition: "business-case",
    competitionLabel: "Business case",
    teamName: "UI/UX gacor",
    members: ["izzah", "asiah", "sachitta"],
    status: "registered",
    registeredAt: "2026-08-12T05:00:00Z",
  },
  {
    id: 1,
    competition: "sar-drone",
    competitionLabel: "SAR drone",
    teamName: null,
    members: ["kejo"],
    status: "registered",
    registeredAt: "2026-09-14T05:00:00Z",
  },
  {
    id: 2,
    competition: "sar-drone",
    competitionLabel: "SAR drone",
    teamName: "Testcase",
    members: ["Hakim", "Fathir", "Mulky"],
    status: "withdrawn",
    registeredAt: "2026-09-03T05:00:00Z",
  },
  {
    id: 3,
    competition: "robot-competition",
    competitionLabel: "Robot competition",
    teamName: "Rakitrususuh",
    members: ["bob", "pajji"],
    status: "awaiting_payment",
    registeredAt: "2026-09-20T05:00:00Z",
  },
  {
    id: 4,
    competition: "business-case",
    competitionLabel: "Business case",
    teamName: "Tim Kopi",
    members: ["raka", "dimasbantai"],
    status: "expired",
    registeredAt: "2026-09-02T05:00:00Z",
  },
]

/* Figma 1932:2391. Statusnya TIDAK disimpan — dihitung dari anggotanya. */
export const mockFinalisRows: FinalisRow[] = [
  {
    id: 0,
    compEvent: "Business case",
    teamName: "UI/UX gacor",
    members: [
      { handle: "izzah", checkedInAt: "08.41" },
      { handle: "asiah", checkedInAt: "08.41" },
      { handle: "sachitta", checkedInAt: null },
    ],
    registeredAt: "2026-08-12",
  },
  {
    id: 1,
    compEvent: "SAR drone",
    teamName: "Elang biru",
    members: [
      { handle: "kejo", checkedInAt: "07.55" },
      { handle: "syahroni", checkedInAt: "07.55" },
    ],
    registeredAt: "2026-08-18",
  },
  {
    id: 2,
    compEvent: "SAR drone",
    teamName: "Testcase",
    members: [
      { handle: "Hakim", checkedInAt: "09.30", skippedGate: true },
      { handle: "jikri", checkedInAt: null },
    ],
    registeredAt: "2026-09-20",
  },
  {
    id: 3,
    compEvent: "Robot competition",
    teamName: "Rakitrususuh",
    members: [
      { handle: "prab", checkedInAt: null },
      { handle: "ted", checkedInAt: null },
    ],
    registeredAt: "2026-08-22",
  },
]
