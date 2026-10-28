import { createClient } from "@/lib/supabase/client"
import type { Booth, VisitorTicket } from "@/lib/types/database"
import type {
  BoothAdminSummary,
  BoothPerimeterUpdateResult,
  UserBoothProgress,
} from "@/lib/booths"

export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: string; message: string } }

// Calls an authenticated API route with the current user's access token.
// Returns { needsAuth: true } when there is no session so the caller can redirect to /login.
export async function postWithAuth<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ needsAuth: true } | { needsAuth: false; ok: boolean; payload: ApiEnvelope<T> }> {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    return { needsAuth: true }
  }

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as ApiEnvelope<T>
  return { needsAuth: false, ok: response.ok, payload }
}

// Same contract as postWithAuth, for GET routes.
export async function getWithAuth<T>(
  path: string,
): Promise<{ needsAuth: true } | { needsAuth: false; ok: boolean; payload: ApiEnvelope<T> }> {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    return { needsAuth: true }
  }

  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  const payload = (await response.json()) as ApiEnvelope<T>
  return { needsAuth: false, ok: response.ok, payload }
}

// --- QR, Attendance & Booth Point Allocation Wiring Helpers (docs/QR-FEATURES.md) ---

export type BoothPointsAllocationData = {
  booth: Booth
  visitor: {
    userId: string
    fullName: string
    email: string
    institution: string | null
  }
  pointsAwarded: number
  standardPointsAwarded: number
  bonusPointsAwarded: number
  totalBoothPointsForVisitor: number
  standardPointsValue: number
  maxBonusPoints: number
  remainingBonusAllowance: number
  alreadyVisited: boolean
  withinPerimeter: boolean | null
  totalPoints: number
  totalVisited: number
}

/**
 * Booth Staff scans a visitor's Personal QR to allocate standard + bonus points (up to booth max).
 */
export async function allocateVisitorBoothPoints(params: {
  visitorQrCode: string
  boothId?: string
  boothSlug?: string
  boothQrCode?: string
  bonusPoints?: number
  activityNote?: string
  latitude?: number
  longitude?: number
}) {
  return postWithAuth<BoothPointsAllocationData>("/api/booths/scan", params)
}

/**
 * Geo-fencing service helper: updates whether the visitor is inside a booth's perimeter.
 */
export async function updateBoothPerimeterStatus(params: {
  boothId?: string
  latitude?: number
  longitude?: number
  withinPerimeter?: boolean
}) {
  return postWithAuth<BoothPerimeterUpdateResult>("/api/booths/scan", {
    action: "perimeter",
    ...params,
  })
}

/**
 * Fetches Booth Admin View summary & recent visitor scans for Booth Staff / Exhibitor.
 */
export async function fetchBoothAdminView(boothId?: string) {
  const query = boothId ? `?boothId=${encodeURIComponent(boothId)}` : ""
  return getWithAuth<BoothAdminSummary>(`/api/booths/scan${query}`)
}

/**
 * Fetches the authenticated visitor's booth visit & point progress.
 */
export async function fetchUserBoothProgress() {
  return getWithAuth<UserBoothProgress>("/api/booths/progress")
}

/**
 * Campus geo-fencing attendance helper: marks visitor as attending on enter or exited on exit
 * for live visitor count tracking.
 */
export async function reportCampusGeoAttendance(params?: {
  event?: "enter" | "exit"
  latitude?: number
  longitude?: number
  gateName?: string
}) {
  return postWithAuth<{
    event: "enter" | "exit"
    checkedIn: boolean
    isOnCampus: boolean
    alreadyCheckedIn: boolean
    checkInTime: string
    ticket: VisitorTicket
  }>("/api/check-in/self", params || {})
}

/**
 * Gate Staff scan helper: confirms entry through an assigned gate and serves as QR tutorial.
 */
export async function scanVisitorGateQr(params: { qrCode: string; gateName?: string }) {
  return postWithAuth<{
    ticket: VisitorTicket
    profile: { full_name: string; email: string; institution?: string | null }
    alreadyCheckedIn: boolean
    gateConfirmed: boolean
    isTutorialScan: boolean
    tutorialMessage: string
    checkInTime: string
  }>("/api/check-in/scan", params)
}
