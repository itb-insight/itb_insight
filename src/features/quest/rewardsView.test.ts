import { describe, expect, it } from "vitest"

import { buildRewardsView, LOGIN_HREF, QR_HREF, type PrizeInput, type RewardsInput } from "./rewardsView"

const sticker = (over: Partial<PrizeInput> = {}): PrizeInput => ({
  tier: 101,
  name: "Sticker",
  left: 300,
  claimedAt: null,
  eligible: false,
  ...over,
})
const mug = (over: Partial<PrizeInput> = {}): PrizeInput => ({ tier: 102, name: "Mug", left: 5, claimedAt: null, eligible: false, ...over })
const keychain = (over: Partial<PrizeInput> = {}): PrizeInput => ({
  tier: 103,
  name: "Keychain",
  left: 5,
  claimedAt: null,
  eligible: false,
  ...over,
})

const input = (over: Partial<RewardsInput> = {}): RewardsInput => ({
  signedIn: true,
  committee: false,
  published: false,
  resultRank: null,
  rank: 20,
  points: 100,
  top10Points: 150,
  freezeClock: "14:50",
  prizes: [sticker(), mug(), keychain()],
  clock: () => "10:15",
  ...over,
})

describe("rewards view", () => {
  it("locks the sticker until a quest is done, then offers it any time", () => {
    const locked = buildRewardsView(input())
    expect(locked.rewards[0]).toMatchObject({ state: "terkunci", action: "1 quest" })
    expect(locked.claim).toBeUndefined()

    const ready = buildRewardsView(input({ prizes: [sticker({ eligible: true }), mug(), keychain()] }))
    expect(ready.rewards[0]).toMatchObject({ state: "ambil", href: QR_HREF, sub: "Ambil kapan saja · sisa 300" })
    expect(ready.claim).toMatchObject({ name: "Sticker", href: QR_HREF })
  })

  it("shows a collected prize as collected, even when stock is now 0", () => {
    const view = buildRewardsView(input({ prizes: [sticker({ eligible: true, claimedAt: "2026-11-28T03:15:00Z", left: 0 })] }))
    expect(view.rewards[0]).toMatchObject({ state: "diambil", sub: "Diterima 10:15 WIB" })
    expect(view.claim).toBeUndefined()
  })

  it("marks a prize out of stock for players who have not collected it", () => {
    const view = buildRewardsView(input({ prizes: [sticker({ eligible: true, left: 0 })] }))
    expect(view.rewards[0]).toMatchObject({ state: "habis", action: "Habis" })
    expect(view.claim).toBeUndefined()
  })

  it("keeps Mug and Keychain for after the results, even for the live top 10", () => {
    const view = buildRewardsView(input({ rank: 3, points: 500 }))
    expect(view.rewards[1]).toMatchObject({ state: "terkunci", action: "Top 5" })
    expect(view.rewards[1].sub).toContain("setelah hasil diumumkan")
    expect(view.youAre).toMatchObject({ rank: "#3", title: "Kamu di Top 10 sementara!" })
  })

  it("offers the rank prize once the results are published", () => {
    const view = buildRewardsView(
      input({ published: true, resultRank: 7, prizes: [sticker(), mug(), keychain({ eligible: true })] }),
    )
    expect(view.rewards[2]).toMatchObject({ state: "ambil", sub: "Kamu peringkat akhir #7 · sisa 5" })
    expect(view.rewards[1].state).toBe("terkunci")
    expect(view.claim?.name).toBe("Keychain")
    expect(view.youAre?.title).toBe("Selamat! Kamu dapat Keychain")
  })

  it("tells the player how far the top 10 is", () => {
    expect(buildRewardsView(input()).youAre?.note).toMatch(/^Butuh 51 poin lagi/)
  })

  it("never offers prizes to committee accounts", () => {
    const view = buildRewardsView(input({ committee: true, prizes: [sticker({ eligible: true })] }))
    expect(view.rewards[0]).toMatchObject({ state: "terkunci", action: "Panitia" })
    expect(view.claim).toBeUndefined()
    expect(view.youAre?.title).toBe("Akun panitia")
  })

  it("asks signed-out visitors to log in", () => {
    const view = buildRewardsView(input({ signedIn: false, rank: null, points: 0 }))
    expect(view.claim).toMatchObject({ action: "Login", href: LOGIN_HREF })
    expect(view.youAre).toBeUndefined()
  })
})
