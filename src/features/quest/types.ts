export type QuestStatus = "default" | "pending" | "review" | "done" | "locked"

export type QuestIconKind = "store" | "calendar" | "clock" | "camera" | "link" | "check" | "none"

export interface QuestStats {
  points: number
  lifetime: number
  rank: number
  totalRanked: number
  tierName: string
  tierTarget: number
  tierSegments: { filled: number; total: number }
}

export interface QuestItem {
  id: string
  title: string
  meta?: string
  points: number
  status: QuestStatus
  icon: QuestIconKind
}

export interface QuestCollection {
  id: string
  title: string
  description: string
  reward: number
  progress: number
  total: number
  segments: { filled: number; total: number }
}

export interface EasterEgg {
  id: string
  title: string
  found: boolean
  source?: string
  reward?: string
  hint?: string
}

export interface QuestDetailData {
  id: string
  title: string
  points: number
  location: string
  hours: string
  rules: string[]
  steps: string[]
  bonusNote: string
  bonusHighlight: string
  bonusSuffix: string
  sponsor: string
}
