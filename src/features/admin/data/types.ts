import type { DivisionTag } from "@/lib/analytics/divisions"

/**
 * Dashboard DTOs: the shapes panels render. adapters.ts fills them from PostHog (web analytics)
 * and Supabase (registrations, check-ins, booth scans), or from mockData.ts when PostHog's query
 * API is not configured. A panel never needs to know which.
 */

export interface DateRange {
  from: string
  to: string
}

export type TrendDirection = "up" | "down" | "flat"

export interface KpiDto {
  id: string
  label: string
  value: string
  /** Comparison sentence, e.g. "12% vs last week". Rendered with a text arrow. */
  delta: string
  direction: TrendDirection
}

export interface DivisionActivityDto {
  division: DivisionTag
  events: number
  share_pct: number
}

export interface FunnelStageDto {
  stage: string
  count: number
  /** Share of the first stage, used for bar width. */
  pct_of_entry: number
}

export interface CompetitionFunnelDto {
  competition_id: string
  competition_name: string
  started: number
  completed: number
  completion_rate_pct: number
}

export interface FunnelDto {
  stages: FunnelStageDto[]
  competitions: CompetitionFunnelDto[]
  /** Largest single stage-to-stage loss — the headline drop-off point. */
  biggest_dropoff_stage: string
  biggest_dropoff_pct: number
}

export interface SponsorStatDto {
  sponsor_id: string
  name: string
  /** Display tier as a label (media partners: M / L / XL). */
  tier: string
  impressions: number
  clicks: number
  ctr_percent: number
}

export interface DeviceEngagementDto {
  device_class: string
  avg_scroll_depth: number
  /** Page views left before 20% scroll. */
  early_bailouts: number
  /** Page views with a scroll measurement. */
  total_sessions: number
}

export interface EngagementDto {
  avg_scroll_depth_pct: number
  /** Mount-to-first-frame for the drone cube. NOT time-to-interactive. null = no samples. */
  drone_ready_ms_p50: number | null
  drone_ready_ms_p90: number | null
  devices: DeviceEngagementDto[]
  alert: string | null
}

export interface TrafficPointDto {
  day: string
  views: number
}

export interface TopPageDto {
  page_path: string
  views: number
}

export interface TrafficDto {
  series: TrafficPointDto[]
  top_pages: TopPageDto[]
}

export interface RecentEventDto {
  id: string
  event_type: string
  /** null for PostHog's own events ($pageview, $web_vitals, ...). */
  division: DivisionTag | null
  page_path: string
  metadata: Record<string, string | number | boolean | null>
  created_at: string
}

// ─── D-day live (GET /api/admin/live, refreshed every 30 s) ─────────────────

export interface CheckInSlotDto {
  /** Start of a 15-minute slot, ISO. */
  slot: string
  count: number
}

export interface BoothLiveDto {
  booth_id: string
  name: string
  /** QR scans today. */
  scans: number
  /** Presence visits of 5 minutes or more today (opted-in visitors only). */
  visits: number
  visitors: number
  median_dwell_s: number | null
  avg_dwell_s: number | null
}

export interface VenueTimeDto {
  /** Checked-in visitors with a later scan or presence ping: their time at the venue is known. */
  measured: number
  /** Checked in, nothing since: time unknown. */
  unmeasured: number
  median_s: number | null
  buckets: { label: string; count: number }[]
}

export interface OnSiteLiveDto {
  checked_in: number
  /** Opted-in visitors with a presence ping in the last 5 minutes (a sample). */
  active_now: number
  /** Opted-in visitors seen at the venue today. */
  presence_users: number
  /** People in the area now: active_now plus the people those visitors represent (0027). */
  in_area_now: number
  /**
   * Everyone who has been in the event area, all time, never going down: profiles with
   * visited_itb or entered_gate, plus the people they represent.
   */
  unique_visitors: number
  /** The represented people included in unique_visitors. */
  represented_total: number
  /** Gate check-ins per 15 minutes, gaps filled with zero, first check-in to now. */
  slots: CheckInSlotDto[]
  booths: BoothLiveDto[]
  venue: VenueTimeDto
}

export interface LiveWebDto {
  /** Distinct visitors with an event in the last 5 minutes. */
  active_visitors: number
  /** Page views in the last 30 minutes. */
  top_pages: TopPageDto[]
}

export interface LiveDto {
  generated_at: string
  /** Start of today (Jakarta), ISO. */
  since: string
  /** null = the Supabase query failed. */
  onsite: OnSiteLiveDto | null
  /** null = PostHog failed or is not configured (see web_configured). */
  web: LiveWebDto | null
  web_configured: boolean
}

// ─── /admin/d-day (admin_dday, migration 0028) ───────────────────────────────

export interface DDayLiveDto {
  /** People assumed in the area now: accounts + the people they represent. */
  in_area_now: number
  /** Accounts whose latest in-area signal is under ASSUME_IN_AREA_HOURS old, with no exit after it. */
  accounts: number
  /** People those accounts represent (0027). */
  represented: number
  /** The oldest latest-signal among them (ISO): how stale the oldest assumption is. */
  oldest_at: string | null
  /** The newest one: everyone still assumed in has dropped out ASSUME_IN_AREA_HOURS after it. */
  newest_at: string | null
  /** Accounts whose phone reported leaving after their latest in-area signal. */
  left: number
  /** Accounts seen today whose window ran out with no exit reported. */
  timed_out: number
  /** Opted-in phones with a presence ping in the last 5 minutes. */
  tracked_now: number
}

export interface DDaySummaryDto {
  /** Gate check-in rows today, skipped-gate ones included. */
  check_ins: number
  skipped_gate: number
  /** Booth scan rows today (first visits and bonuses). */
  booth_scans: number
  /** Points given at booths today (base + bonus). */
  points_given: number
  booths_active: number
  /** Distinct (visitor, booth) pairs today. */
  booth_visits: number
}

export interface DDayFunnelDto {
  /** Distinct visitors today: checked in or scanned at a booth. */
  visitors: number
  scanned_1: number
  scanned_5: number
  reached_target: number
  claimed: number
}

export interface DDayGateSlotDto {
  /** Start of a 5-minute slot, ISO. */
  slot: string
  /** gate_check_ins.gate_name, raw (gateLabel() names it). */
  gate: string
  count: number
}

export interface DDayBoothDto {
  id: string
  name: string
  /** Map position, null when the booth has none. */
  lng: number | null
  lat: number | null
  /** Today. */
  scans: number
  points: number
  /** Scans in the last 30 min / 1 / 2 / 5 / 12 hours, for the heat map tabs. */
  windows: Record<"30m" | "1h" | "2h" | "5h" | "12h", number>
}

export interface DDayStaffDto {
  kind: "gate" | "booth"
  /** gate_name for gates, booth id for booths. */
  location: string
  user_id: string
  name: string
  role_a: string | null
  role_b: string | null
  scans: number
  points: number
  last_at: string | null
}

export interface DDayDataDto {
  live: DDayLiveDto
  summary: DDaySummaryDto
  funnel: DDayFunnelDto
  medians: { checkin_to_first_scan_s: number | null; between_scans_s: number | null }
  gates: DDayGateSlotDto[]
  booths: DDayBoothDto[]
  staff: DDayStaffDto[]
}

export interface DDayDto {
  generated_at: string
  /** Start of today (Jakarta), ISO. */
  since: string
  /** Past closing time (Jakarta): the page warns that the headcount is an assumption. */
  after_close: boolean
  /** null = the query failed. */
  data: DDayDataDto | null
}
