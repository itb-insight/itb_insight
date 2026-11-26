import type {
  FlashQuest,
  LiveBoardData,
  QuestOpsStats,
  QuestRow,
  SidequestSubmissionRow,
  SidequestWindowState,
} from "./types"

const MIN = 60_000

function mockWindow(now: number): SidequestWindowState {
  const closesAt = new Date(now + (1 * 60 + 42) * MIN + 10_000).toISOString()
  return {
    status: "open",
    isOpen: true,
    isFrozen: false,
    startsAt: new Date(now - 4 * 60 * MIN).toISOString(),
    closesAt,
    freezeCutoffIso: null,
    startHourWib: 5,
    closeHourWib: 17,
  }
}

const PLAYERS: [string, string | null, number][] = [
  ["Bima Sakti", "FTI", 3190],
  ["Nadia Putri", "STEI", 3189],
  ["Asep Saepudin", "FTMD", 3170],
  ["Agus Budiman", "SITH", 3168],
  ["Clarisa Rahma", "FSRD", 3166],
  ["Bisma Dewantara", null, 2999],
  ["Rusman", "FTTM", 2998],
  ["Dodi Ardiansyah", null, 2856],
  ["Reza Aditya", "FTI", 2800],
  ["Zaki Darmawan", "FITB", 1000],
]

export function mockLiveBoard(now = Date.now()): LiveBoardData {
  return {
    leaderboard: {
      window: mockWindow(now),
      entries: PLAYERS.map(([fullName, institution, totalPoints], i) => ({
        rank: i + 1,
        userId: `u-${i + 1}`,
        fullName,
        institution,
        totalPoints,
        boothPoints: Math.round(totalPoints * 0.7),
        sidequestPoints: totalPoints - Math.round(totalPoints * 0.7),
        lastPointAt: new Date(now - (i + 1) * 3 * MIN).toISOString(),
      })),
    },
    flashQuest: {
      id: "flash-sponsor-c",
      label: "2x points at [SPONSOR C]",
      location: "Booth [B4], near [LANDMARK]",
      durationMin: 15,
      endsAt: new Date(now + 14 * MIN + 59_000).toISOString(),
    },
    doorprizeTopN: 3,
    players: 821,
    questsDone: 8420,
    updatedAt: new Date(now).toISOString(),
  }
}

export function mockFlashQuests(now = Date.now()): FlashQuest[] {
  return [
    {
      id: "flash-sponsor-c",
      label: "[SPONSOR C] 2x",
      location: "Booth [B4]",
      durationMin: 15,
      endsAt: new Date(now + 14 * MIN + 59_000).toISOString(),
    },
    { id: "flash-quiet-zone", label: "Quiet zone [D] 1,5x", location: "Zona D", durationMin: 15, endsAt: null },
    { id: "flash-main-stage", label: "Main stage check-in +50", location: "Main stage", durationMin: 10, endsAt: null },
  ]
}

export const MOCK_STATS: QuestOpsStats = {
  players: 812,
  participationPct: 41,
  attendance: 1980,
  questsDone: 6430,
  boothVisits: 3115,
  redemptions: { merch: 201, sponsor: 57 },
}

export const MOCK_QUESTS: QuestRow[] = [
  { code: "BO-01", name: "[SPONSOR A] live demo", owner: "Fundraise", verify: "Staff code", points: 150, done: 412, flag: null, state: "live" },
  { code: "BO-02", name: "[SPONSOR B] challenge", owner: "Fundraise", verify: "Staff code", points: 200, done: 96, flag: null, state: "live" },
  { code: "LM-04", name: "Labtek laser show", owner: "Events", verify: "QR + photo", points: 80, done: 388, flag: "QR Reused x4", state: "paused" },
  { code: "EV-02", name: "Keynote: [TALK TITLE]", owner: "Events", verify: "auto check-in", points: 100, done: 530, flag: null, state: "live" },
  { code: "RW-03", name: "Post your insight moment", owner: "Marketing", verify: "moderated", points: 30, done: 144, flag: "23 in review", state: "live" },
  { code: "RW-04", name: "[SPONSOR B] prize", owner: "Fundraise", verify: "staff redeem", points: -250, done: 40, flag: "stock 0", state: "paused" },
]

export function mockSubmissions(now = Date.now()): SidequestSubmissionRow[] {
  return [
    {
      id: "sub-1",
      quest_id: "q-add-yours",
      user_id: "u-salsa",
      proof_url: "https://instagram.com/p/[POST-ID]",
      note: null,
      status: "pending",
      points_awarded: 0,
      submitted_at: new Date(now - 4 * MIN).toISOString(),
      sidequests: { id: "q-add-yours", slug: "add-yours-moment-dday", category: "marketing", title: "Post your insight moment", points: 30 },
      profiles: { full_name: "Salsa Maharani", email: null, institution: "STEI" },
    },
    {
      id: "sub-2",
      quest_id: "q-add-yours",
      user_id: "u-yoga",
      proof_url: "https://tiktok.com/@[HANDLE]/video/[ID]",
      note: null,
      status: "pending",
      points_awarded: 0,
      submitted_at: new Date(now - 9 * MIN).toISOString(),
      sidequests: { id: "q-add-yours", slug: "add-yours-moment-dday", category: "marketing", title: "Post your insight moment", points: 30 },
      profiles: { full_name: "Yoga Tirta", email: null, institution: null },
    },
  ]
}
