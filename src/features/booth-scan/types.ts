// Client-side shapes of POST /api/booths/scan (server: src/lib/booths.ts, which is server-only)
// and the copy for the wireframe warning screens, shared by the staff scanner and the admin tester.

export type AwardMode = "visit" | "bonus" | "manual"

export type BoothWarnings = {
  highPoints: boolean
  nonBoothStaff: boolean
  repeatVisit: boolean
  primaryWarning: "high_points" | "non_booth_staff" | "repeat_visit" | null
}

export type ScanVisitor = { userId: string; fullName: string; institution: string | null }

export type ScanBooth = { id: string; name: string; points?: number; max_bonus_points?: number } | null

export type ScanPreview = {
  booth: ScanBooth
  visitor: ScanVisitor
  checkedIn: boolean
  mode: AwardMode
  alreadyVisited: boolean
  basePoints: number
  bonusPoints: number
  pointsToAward: number
  bonusRemaining: number | null
  isAssignedBoothStaff: boolean
  warnings: BoothWarnings
}

export type ScanAward = {
  booth: ScanBooth
  visitor: ScanVisitor
  mode: AwardMode
  pointsAwarded: number
  bonusPoints: number
  alreadyVisited: boolean
  bonusRemaining: number | null
  skippedGate: boolean
  totalPoints: number
  totalVisited: number
  awardedByName: string | null
}

type WarningScreen = { key: string; title: string; body: string }

/** The wireframe screens that apply, most important first (high_points > non_booth_staff > repeat_visit). */
export function warningScreens(preview: Pick<ScanPreview, "warnings" | "pointsToAward" | "bonusRemaining">): WarningScreen[] {
  const { warnings } = preview
  const screens: WarningScreen[] = []
  if (warnings.highPoints) {
    screens.push({
      key: "high_points",
      title: "BANYAK BANGET!",
      body: `${preview.pointsToAward} poin melewati batas wajar. Pastikan jumlahnya benar.`,
    })
  }
  if (warnings.nonBoothStaff) {
    screens.push({
      key: "non_booth_staff",
      title: "Yakin?",
      body: "Kamu tidak terdaftar sebagai staf booth ini. Pastikan kamu memberi poin atas nama booth yang benar.",
    })
  }
  if (warnings.repeatVisit) {
    screens.push({
      key: "repeat_visit",
      title: "Berikan Bonus?",
      body: "Pengunjung ini sudah menerima poin booth ini. Kunjungan ulang hanya bisa diberi bonus.",
    })
  }
  return screens
}
