// Sementara: ganti dengan import dari "@/lib/sidequests" setelah feat/sidequest-backend masuk dev

export type SidequestWindowState = {
  status: "not_started" | "open" | "frozen"
  isOpen: boolean
  isFrozen: boolean
  startsAt: string | null
  closesAt: string | null
  freezeCutoffIso: string | null
  startHourWib: number
  closeHourWib: number
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  fullName: string
  institution: string | null
  totalPoints: number
  boothPoints: number
  sidequestPoints: number
  lastPointAt: string
}

export type LeaderboardResponse = {
  window: SidequestWindowState
  entries: LeaderboardEntry[]
}

export type SidequestCategory = "marketing" | "acara" | "competition" | "fundraise"

export type SidequestSubmissionRow = {
  id: string
  quest_id: string
  user_id: string
  proof_url: string | null
  note: string | null
  status: "pending" | "approved" | "rejected"
  points_awarded: number
  submitted_at: string
  sidequests: { id: string; slug: string; category: SidequestCategory; title: string; points: number } | null
  profiles: { full_name: string; email: string | null; institution: string | null } | null
}

export type FlashQuest = {
  id: string
  label: string
  location: string
  durationMin: number
  endsAt: string | null
}

export type QuestState = "live" | "paused"

export type QuestRow = {
  code: string
  name: string
  owner: string
  verify: string
  points: number
  done: number
  flag: string | null
  state: QuestState
}

export type QuestOpsStats = {
  players: number
  participationPct: number
  attendance: number
  questsDone: number
  boothVisits: number
  redemptions: { merch: number; sponsor: number }
}

export type LiveBoardData = {
  leaderboard: LeaderboardResponse
  flashQuest: FlashQuest | null
  doorprizeTopN: number
  players: number
  questsDone: number
  updatedAt: string
}
