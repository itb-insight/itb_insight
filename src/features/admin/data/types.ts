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
