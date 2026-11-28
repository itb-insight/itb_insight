import { describe, expect, it } from "vitest"

import { classifyResult, clockSkew, dedupeKey, qrTail, sendOrder, type QueueEntry } from "./queue"

const response = (status: number, code: string | null = null, success = false) =>
  ({ type: "response", status, success, code }) as const

describe("classifyResult", () => {
  it("removes an entry the server wrote, including a replay (duplicate)", () => {
    expect(classifyResult(response(200, null, true))).toBe("done")
  })

  it("keeps an entry when the server could not decide yet", () => {
    expect(classifyResult({ type: "network" })).toBe("retry")
    expect(classifyResult({ type: "auth" })).toBe("retry")
    expect(classifyResult(response(500, "DATABASE_ERROR"))).toBe("retry")
    expect(classifyResult(response(502))).toBe("retry")
    expect(classifyResult(response(423, "PAUSED"))).toBe("retry")
    expect(classifyResult(response(401, "UNAUTHORIZED"))).toBe("retry")
    expect(classifyResult(response(429))).toBe("retry")
  })

  it("gives up on a definite refusal, for staff to see", () => {
    for (const [status, code] of [
      [409, "ALREADY_GIVEN"],
      [404, "TICKET_NOT_FOUND"],
      [403, "CLOSED"],
      [403, "NOT_OPEN"],
      [400, "INVALID_QR"],
      [403, "BOOTH_NOT_ALLOWED"],
      [403, "SELF_AWARD"],
      [400, "INVALID_INPUT"],
      [403, "FORBIDDEN"],
    ] as const) {
      expect(classifyResult(response(status, code))).toBe("failed")
    }
  })
})

describe("queue helpers", () => {
  const entry = (id: string, capturedAt: string, extra: Partial<QueueEntry> = {}): QueueEntry => ({
    id,
    kind: "booth",
    staffUserId: "staff-1",
    dedupeKey: id,
    body: {},
    capturedAt,
    label: id,
    attempts: 0,
    status: "pending",
    ...extra,
  })

  it("sends this account's pending entries, oldest scan first", () => {
    const order = sendOrder(
      [
        entry("b", "2026-11-28T03:02:00.000Z"),
        entry("a", "2026-11-28T03:01:00.000Z"),
        entry("other", "2026-11-28T03:00:00.000Z", { staffUserId: "staff-2" }),
        entry("refused", "2026-11-28T03:00:00.000Z", { status: "failed" }),
      ],
      "staff-1",
    )
    expect(order.map((e) => e.id)).toEqual(["a", "b"])
  })

  it("keys one award per visitor, booth and option", () => {
    expect(dedupeKey("booth", "itbi:v1:abc", "booth-1", "bonus")).not.toBe(dedupeKey("booth", "itbi:v1:abc", "booth-1", "contribution"))
    expect(dedupeKey("gate", "itbi:v1:abc")).toBe("gate:itbi:v1:abc::")
    expect(qrTail("itbi:v1:abcdefgh")).toBe("efgh")
  })

  it("estimates the phone's clock offset from the Date header", () => {
    // Server says 12:00:00 (whole second), the request took 12:00:00.200 -> 12:00:00.400 on a phone
    // that is 5 s slow: 11:59:55.200 -> 11:59:55.400.
    const server = Date.parse("2026-11-28T05:00:00.000Z")
    const start = Date.parse("2026-11-28T04:59:55.200Z")
    const end = Date.parse("2026-11-28T04:59:55.400Z")
    expect(Math.abs(clockSkew(server, start, end) - 5000)).toBeLessThanOrEqual(500)
  })
})
