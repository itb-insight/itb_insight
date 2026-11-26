import { mockLiveBoard } from "./mockData"
import type { LiveBoardData } from "./types"

export const LIVE_REFRESH_MS = 5 * 60_000

// TODO: ganti dengan fetch("/api/sidequests/leaderboard?limit=10") setelah API sidequest masuk dev
export async function loadLiveBoard(): Promise<LiveBoardData> {
  return mockLiveBoard()
}
