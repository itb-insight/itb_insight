import type { DivisionTag } from "@/lib/analytics/divisions"

/**
 * Dashboard DTOs.
 *
 * Field names mirror the SQL column names in docs/analytics/schema.sql
 * one-to-one, including the sponsor_stats materialized view. That is
 * deliberate: when the real database lands, each adapter becomes close to a
 * literal SELECT with no mapping layer to write.
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
  checked_in: number
  completion_rate_pct: number
}

export interface FunnelDto {
  stages: FunnelStageDto[]
  competitions: CompetitionFunnelDto[]
  /** Largest single stage-to-stage loss — the headline drop-off point. */
  biggest_dropoff_stage: string
  biggest_dropoff_pct: number
}

/** Mirrors the sponsor_stats materialized view exactly. */
export interface SponsorStatDto {
  sponsor_id: string
  name: string
  tier: "platinum" | "gold" | "silver"
  impressions: number
  clicks: number
  ctr_percent: number
}

export interface DeviceEngagementDto {
  device_class: string
  avg_scroll_depth: number
  early_bailouts: number
  total_sessions: number
}

export interface EngagementDto {
  avg_scroll_depth_pct: number
  /** Mount-to-first-frame for the drone cube. NOT time-to-interactive. */
  drone_ready_ms_p50: number
  drone_ready_ms_p90: number
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

/** Mirrors the events table. */
export interface RecentEventDto {
  id: number
  event_type: string
  division: DivisionTag
  page_path: string
  metadata: Record<string, string | number | boolean | null>
  created_at: string
}
