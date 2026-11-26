import type { EasterEgg, QuestCollection, QuestDetailData, QuestItem, QuestStats } from "./types"

export const MOCK_STATS: QuestStats = {
  points: 648,
  lifetime: 1248,
  rank: 37,
  totalRanked: 812,
  tierName: "Silver",
  tierTarget: 1500,
  tierSegments: { filled: 3, total: 5 },
}

export const MOCK_FLASH = {
  title: "FLASH QUEST!",
  description: "2x points at [SPONSOR C] booth",
  secondsLeft: 14 * 60 + 59,
}

export const MOCK_MAIN_QUESTS: QuestItem[] = [
  { id: "live-demo", title: "Try the live demo at [SPONSOR A]", meta: "Staff code", points: 150, status: "default", icon: "store" },
  { id: "keynote", title: "Keynote: [TALK TITLE]", meta: "Auto check-in", points: 100, status: "default", icon: "calendar" },
  { id: "laser-show", title: "Labtek laser show", meta: "Pending sync", points: 80, status: "pending", icon: "clock" },
  { id: "moment", title: "Post your #ITBInsight moment", meta: "Under Review", points: 30, status: "review", icon: "camera" },
  { id: "twin-buildings", title: "Plaza Widya twin buildings", points: 80, status: "done", icon: "check" },
  { id: "engineering-challenge", title: "[SPONSOR B] engineering challenge", points: 200, status: "done", icon: "check" },
  { id: "workshop", title: "Worskhop: [WORKSHOP TITLE]", points: 100, status: "locked", icon: "none" },
]

export const MOCK_COLLECTIONS: QuestCollection[] = [
  { id: "ganesha-explorer", title: "Ganesha Explorer", description: "Visit every landmark", reward: 200, progress: 5, total: 8, segments: { filled: 3, total: 5 } },
  { id: "booth-hopper", title: "Booth Hopper", description: "Complete any booth quests", reward: 200, progress: 5, total: 8, segments: { filled: 3, total: 5 } },
  { id: "full-day", title: "Full Day", description: "Attend a talk, workshop and a competition final", reward: 200, progress: 5, total: 8, segments: { filled: 3, total: 5 } },
]

export const MOCK_EASTER_EGGS: EasterEgg[] = [
  { id: "404", title: "The 404 Page", found: true, source: "Found on the website", reward: "+40 surprise" },
  { id: "glitch", title: "Screen Glitch", found: true, source: "Big screen at 11:11", reward: "+60 surprise" },
  { id: "hidden-1", title: "Unknown", found: false, hint: "Hint: [HINT 1]" },
  { id: "hidden-2", title: "Unknown", found: false, hint: "Hint: [HINT 1]" },
  { id: "hidden-3", title: "Unknown", found: false, hint: "Hint: [HINT 1]" },
  { id: "hidden-4", title: "Unknown", found: false, hint: "Hint: [HINT 1]" },
]

export const MOCK_QUEST_DETAILS: Record<string, QuestDetailData> = {
  "live-demo": {
    id: "live-demo",
    title: "Try the live demo at [SPONSOR A]",
    points: 150,
    location: "Booth [A3]",
    hours: "09:00-17:00",
    rules: ["Limit to once per person", "Verified by staff code"],
    steps: [
      "Go to the [SPONSOR A] booth and try the demo.",
      "Ask the booth crew for your quest code.",
      "Scan it, or type it in below.",
    ],
    bonusNote: "Booth crew can award up to ",
    bonusHighlight: "+50 bonus",
    bonusSuffix: " for standout answers.",
    sponsor: "[SPONSOR A]",
  },
}

export function getQuestDetail(id: string): QuestDetailData | undefined {
  const known = MOCK_QUEST_DETAILS[id]
  if (known) return known
  const quest = MOCK_MAIN_QUESTS.find((item) => item.id === id && item.status !== "locked")
  if (!quest) return undefined
  const base = MOCK_QUEST_DETAILS["live-demo"]
  return { ...base, id: quest.id, title: quest.title, points: quest.points }
}
