export const COUNTDOWN_TARGET = "2026-11-28T08:00:00+07:00"

export const CALENDAR_RANGE = {
  from: "2026-10",
  to: "2026-11",
} as const

/** End of D-day (00:00 WIB on the 29th): the D-day-only shortcuts below stop after this. */
export const D_DAY_END = "2026-11-29T00:00:00+07:00"

export const isBeforeDDayEnd = (now = Date.now()) => now < Date.parse(D_DAY_END)
