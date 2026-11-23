
export type StaffLocationKind = "gate" | "booth"

export interface StaffScanRow {
  id: string
  name: string
  role: string
  totalScan: number
  totalPoints: number
  lastScan: string | null
}

export interface StaffScanGroup {
  id: string
  label: string
  kind: StaffLocationKind
  totalScan: number
  totalPoints: number
  staff: StaffScanRow[]
}

export type TeamRegistrationStatus = "registered" | "withdrawn" | "awaiting_payment" | "expired"

export interface TeamRegistrationRow {
  id: number | string
  competition: string
  competitionLabel: string
  teamName: string | null
  members: string[]
  status: TeamRegistrationStatus
  registeredAt: string | Date
}

export interface CompetitionOption {
  value: string
  label: string
}

/* ── Kehadiran finalis di hari-H (Figma 1932:2391) ─────────────────────────── */

/** Lengkap = semua anggota check-in, Sebagian = sebagian, Belum = tidak ada. */
export type FinalisStatus = "lengkap" | "sebagian" | "belum"

export interface FinalisMember {
  /** Tanpa "@" — ditambahkan saat digambar. */
  handle: string
  /** Jam check-in, mis. "09.30". null = belum check-in. */
  checkedInAt: string | null
  /**
   * Hadir tapi tidak lewat gate; di tabel ditulis "skipped gate" setelah jamnya.
   * Sama dengan check_in_type 'booth_skipped_gate' di migration 0010.
   */
  skippedGate?: boolean
}

export interface FinalisRow {
  id: number | string
  /** Nama lomba atau event, mis. "SAR drone". */
  compEvent: string
  teamName: string
  members: FinalisMember[]
  registeredAt: string | Date
}
