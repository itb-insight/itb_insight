import type { RewardEntry } from "./RewardsMobile"

/*
  What /arcade/rewards shows, from the player's prizes (arcade_player_prizes, migration 0039) and
  the live board. Pure, so the rules are tested (rewardsView.test.ts):
    - Sticker (101): collect any time once a quest is done, while stock lasts.
    - Mug (102, final rank 1-5) and Keychain (103, rank 6-10): collected after the final results
      are published, at the same desk.
  Points are never spent; they only rank players.
*/

export type PrizeInput = {
  tier: number
  name: string
  left: number | null
  claimedAt: string | null
  eligible: boolean
}

export type RewardsInput = {
  signedIn: boolean
  committee: boolean
  published: boolean
  /** Final rank in the published results (null before publication or outside the results). */
  resultRank: number | null
  /** Live rank and points on the board. */
  rank: number | null
  points: number
  /** Points of the current #10 (null when fewer than 10 players). */
  top10Points: number | null
  /** "14:50", when the board freezes. */
  freezeClock: string | null
  prizes: PrizeInput[]
  /** Formats claimedAt as a WIB clock. */
  clock: (iso: string) => string
}

export type RewardsView = {
  rewards: RewardEntry[]
  claim?: { status: string; name: string; note: string; action: string; href: string }
  youAre?: { rank: string; title: string; note: string }
}

export const QR_HREF = "/arcade/qr"
export const LOGIN_HREF = "/login?next=/arcade/rewards"
const DESK = "Booth Entrepreneur"

function requirement(tier: number): { short: string; long: string } {
  if (tier === 101) return { short: "1 quest", long: "Selesaikan 1 quest" }
  if (tier === 102) return { short: "Top 5", long: "Peringkat akhir 1–5" }
  return { short: "Top 6–10", long: "Peringkat akhir 6–10" }
}

function stockNote(left: number | null): string {
  return left === null ? "" : ` · sisa ${left}`
}

function rewardFor(p: PrizeInput, input: RewardsInput): RewardEntry {
  const req = requirement(p.tier)
  const base = { badge: "MERCH", name: p.name }
  const rankPrize = p.tier !== 101

  if (p.claimedAt) return { ...base, state: "diambil", action: "Diambil", sub: `Diterima ${input.clock(p.claimedAt)} WIB` }
  if (input.committee) return { ...base, state: "terkunci", action: "Panitia", sub: `${req.long}${stockNote(p.left)}` }
  if (p.left === 0) return { ...base, state: "habis", action: "Habis", sub: "Stok habis" }
  if (p.eligible && (!rankPrize || input.published)) {
    return {
      ...base,
      state: "ambil",
      action: "Ambil",
      href: QR_HREF,
      sub: rankPrize ? `Kamu peringkat akhir #${input.resultRank}${stockNote(p.left)}` : `Ambil kapan saja${stockNote(p.left)}`,
    }
  }
  if (rankPrize && !input.published) {
    return { ...base, state: "terkunci", action: req.short, sub: `${req.long} · diambil setelah hasil diumumkan` }
  }
  return { ...base, state: "terkunci", action: req.short, sub: `${req.long}${stockNote(p.left)}` }
}

function youAreFor(input: RewardsInput): RewardsView["youAre"] {
  if (!input.signedIn) return undefined
  if (input.committee) {
    return { rank: "-", title: "Akun panitia", note: "Poinmu dihitung untuk uji coba, tapi tidak masuk peringkat dan tidak mendapat hadiah." }
  }
  if (input.published) {
    const r = input.resultRank
    if (r !== null && r <= 5) return { rank: `#${r}`, title: "Selamat! Kamu dapat Mug", note: `Ambil di ${DESK} dengan menunjukkan QR profilmu.` }
    if (r !== null && r <= 10) return { rank: `#${r}`, title: "Selamat! Kamu dapat Keychain", note: `Ambil di ${DESK} dengan menunjukkan QR profilmu.` }
    return { rank: r ? `#${r}` : "-", title: "Hasil akhir sudah diumumkan", note: "Terima kasih sudah bermain Insight Arcade!" }
  }
  const freeze = input.freezeClock ? `Papan dibekukan ${input.freezeClock} WIB. ` : ""
  const later = "Mug & Keychain diambil setelah hasil akhir diumumkan."
  if (input.rank !== null && input.rank <= 10) {
    return { rank: `#${input.rank}`, title: "Kamu di Top 10 sementara!", note: `${freeze}${later}` }
  }
  const gap = input.top10Points !== null ? input.top10Points + 1 - input.points : null
  return {
    rank: input.rank ? `#${input.rank}` : "-",
    title: "Top 10 dapat Mug & Keychain",
    note: gap !== null && gap > 0 ? `Butuh ${gap} poin lagi untuk masuk Top 10. ${freeze}` : `${freeze}${later}`,
  }
}

export function buildRewardsView(input: RewardsInput): RewardsView {
  const rewards = input.prizes.map((p) => rewardFor(p, input))
  const ready = rewards.find((r) => r.state === "ambil")
  const claim: RewardsView["claim"] = !input.signedIn
    ? {
        status: "BELUM LOGIN",
        name: "Lihat hadiahmu",
        note: "Login untuk melihat hadiah yang sudah bisa kamu ambil.",
        action: "Login",
        href: LOGIN_HREF,
      }
    : ready
      ? {
          status: `SIAP DIAMBIL · ${DESK.toUpperCase()}`,
          name: ready.name,
          note: "Tunjukkan QR profilmu ke panitia. Satu per orang.",
          action: "QR",
          href: QR_HREF,
        }
      : undefined
  return { rewards, claim, youAre: youAreFor(input) }
}
