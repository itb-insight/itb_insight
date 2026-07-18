import type {
  CompetitionFunnelDto,
  DivisionActivityDto,
  EngagementDto,
  FunnelStageDto,
  KpiDto,
  SponsorStatDto,
  TrafficDto,
} from "./types"

/**
 * Hard-coded dashboard figures for the MVP.
 *
 * DO NOT IMPORT THIS FILE FROM A COMPONENT. Everything goes through
 * adapters.ts — that rule is what keeps the mock/real boundary a single seam
 * instead of a search-and-replace across the panel tree.
 *
 * Numbers are taken from the reference mock so the dashboard matches the
 * design that was signed off.
 */

export const MOCK_KPIS: KpiDto[] = [
  { id: "visitors", label: "Total Visitors", value: "8,412", delta: "12% vs last week", direction: "up" },
  { id: "registrations", label: "Registrations Completed", value: "1,203", delta: "74% completion rate", direction: "up" },
  { id: "checkin", label: "Check-in Rate", value: "68%", delta: "vs 71% last event", direction: "flat" },
  { id: "sponsor-ctr", label: "Avg Sponsor CTR", value: "4.2%", delta: "0.6pt this week", direction: "up" },
  { id: "flythrough", label: "Flythrough Completion", value: "61%", delta: "mobile bail-outs high", direction: "down" },
]

export const MOCK_DIVISION_ACTIVITY: DivisionActivityDto[] = [
  { division: "CPT", events: 663, share_pct: 31 },
  { division: "MKT", events: 556, share_pct: 26 },
  { division: "EV", events: 385, share_pct: 18 },
  { division: "SP", events: 278, share_pct: 13 },
  { division: "CB", events: 257, share_pct: 12 },
  { division: "MISC", events: 0, share_pct: 0 },
]

export const MOCK_FUNNEL_STAGES: FunnelStageDto[] = [
  { stage: "Landing", count: 4890, pct_of_entry: 100 },
  { stage: "Started", count: 1940, pct_of_entry: 40 },
  { stage: "Completed", count: 1203, pct_of_entry: 25 },
  { stage: "Checked in", count: 818, pct_of_entry: 17 },
]

export const MOCK_COMPETITIONS: CompetitionFunnelDto[] = [
  {
    competition_id: "hackathon-insight",
    competition_name: "Hackathon Insight",
    started: 612,
    completed: 490,
    checked_in: 371,
    completion_rate_pct: 80,
  },
  {
    competition_id: "business-case-comp",
    competition_name: "Business Case Comp.",
    started: 544,
    completed: 381,
    checked_in: 265,
    completion_rate_pct: 70,
  },
  {
    competition_id: "ui-ux-sprint",
    competition_name: "UI/UX Sprint",
    started: 398,
    completed: 210,
    checked_in: 182,
    completion_rate_pct: 53,
  },
]

export const MOCK_SPONSORS: SponsorStatDto[] = [
  { sponsor_id: "telkom", name: "Telkom Indonesia", tier: "platinum", impressions: 18204, clicks: 1092, ctr_percent: 6.0 },
  { sponsor_id: "mandiri", name: "Bank Mandiri", tier: "gold", impressions: 15880, clicks: 714, ctr_percent: 4.5 },
  { sponsor_id: "pertamina", name: "Pertamina", tier: "gold", impressions: 14102, clicks: 592, ctr_percent: 4.2 },
  { sponsor_id: "goto", name: "GoTo", tier: "silver", impressions: 9340, clicks: 201, ctr_percent: 2.2 },
  { sponsor_id: "dicoding", name: "Dicoding", tier: "silver", impressions: 7110, clicks: 98, ctr_percent: 1.4 },
]

export const MOCK_ENGAGEMENT: EngagementDto = {
  avg_scroll_depth_pct: 61,
  drone_ready_ms_p50: 840,
  drone_ready_ms_p90: 3120,
  devices: [
    { device_class: "Desktop", avg_scroll_depth: 82, early_bailouts: 118, total_sessions: 3980 },
    { device_class: "Mobile — high", avg_scroll_depth: 58, early_bailouts: 642, total_sessions: 3120 },
    { device_class: "Mobile — low", avg_scroll_depth: 23, early_bailouts: 541, total_sessions: 1312 },
  ],
  alert:
    "41% of low-end mobile sessions bail before 20% scroll depth — the p90 drone_ready_ms of 3.1s points at load time, not disinterest.",
}

export const MOCK_TRAFFIC: TrafficDto = {
  series: [
    { day: "Jul 12", views: 782 },
    { day: "Jul 13", views: 864 },
    { day: "Jul 14", views: 1103 },
    { day: "Jul 15", views: 1042 },
    { day: "Jul 16", views: 1338 },
    { day: "Jul 17", views: 1490 },
    { day: "Jul 18", views: 1793 },
  ],
  top_pages: [
    { page_path: "/register/hackathon-insight", views: 2140 },
    { page_path: "/flythrough", views: 1884 },
    { page_path: "/sponsors", views: 1092 },
    { page_path: "/schedule", views: 764 },
  ],
}
