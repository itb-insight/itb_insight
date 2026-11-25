import { describe, expect, it } from "vitest"

import { clockWib, formatCount, formatHms, formatMs, publicName } from "./format"
import { validateGrant } from "./ops/ManualGrantForm"

describe("format", () => {
  it("menyingkat nama untuk layar publik", () => {
    expect(publicName("Bima Sakti Pratama")).toBe("Bima S.")
    expect(publicName("Rusman")).toBe("Rusman")
    expect(publicName("  ")).toBe("Anonim")
  })

  it("format angka dan waktu", () => {
    expect(formatCount(3190)).toBe("3,190")
    expect(formatHms(((1 * 60 + 42) * 60 + 10) * 1000)).toBe("01 : 42 : 10")
    expect(formatMs((14 * 60 + 59) * 1000)).toBe("14:59")
    expect(formatMs(-5000)).toBe("00:00")
  })

  it("jam selalu WIB", () => {
    expect(clockWib("2026-11-28T16:40:00Z")).toBe("23:40")
  })
})

describe("validateGrant", () => {
  const ok = { userRef: "U-0812-37", points: "80", reason: "QR rusak, staff verifikasi langsung" }

  it("menerima input yang valid, termasuk koreksi negatif", () => {
    expect(validateGrant(ok)).toBeNull()
    expect(validateGrant({ ...ok, points: "-50" })).toBeNull()
  })

  it("menolak input yang tidak valid", () => {
    expect(validateGrant({ ...ok, userRef: " " })).toMatch(/User ref/)
    expect(validateGrant({ ...ok, points: "0" })).toMatch(/tidak boleh 0/)
    expect(validateGrant({ ...ok, points: "1.5" })).toMatch(/bilangan bulat/)
    expect(validateGrant({ ...ok, points: "1001" })).toMatch(/maksimal/)
    expect(validateGrant({ ...ok, reason: "rusak" })).toMatch(/Reason/)
  })
})
