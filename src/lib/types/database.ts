export type UserRole = 'admin' | 'field_staff' | 'gate_staff' | 'booth_staff' | 'exhibitor'

export type Profile = {
  id: string
  full_name: string
  email: string
  phone?: string | null
  institution?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export type VisitorTicket = {
  id: string
  user_id: string
  qr_code: string
  ticket_type: string
  checked_in: boolean
  checked_in_at: string | null
  checked_in_by?: string | null
  created_at: string
  updated_at: string
}

export type GateCheckIn = {
  id: string
  ticket_id: string
  user_id: string
  checked_in_by?: string | null
  gate_name: string
  check_in_type: 'staff_scan' | 'self_scan' | 'manual_lookup'
  checked_in_at: string
}

export type Booth = {
  id: string
  slug: string
  name: string
  category: string
  description?: string | null
  location_name?: string | null
  coordinate_x?: number | null
  coordinate_y?: number | null
  qr_code: string
  points: number
  exhibitor_user_id?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type BoothScanEvent = {
  id: string
  user_id: string
  booth_id: string
  points_awarded: number
  scanned_at: string
}

export type RSVPInvite = {
  id: string
  token: string
  invitee_name: string
  institution: string
  position?: string | null
  email: string
  phone?: string | null
  attendance_status: 'pending' | 'attending' | 'not_attending' | 'represented'
  substitute_name?: string | null
  e_ticket_code?: string | null
  checked_in: boolean
  checked_in_at?: string | null
  responded_at?: string | null
  created_at: string
  updated_at: string
}

export type FeedbackResponse = {
  id: string
  context: 'event' | 'booth' | 'inspirates'
  booth_id?: string | null
  user_id?: string | null
  rating: number
  category?: string | null
  comment?: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

export type Partner = {
  id: string
  name: string
  tier: 'diamond' | 'gold' | 'silver' | 'bronze' | 'media_partner'
  logo_url: string
  website_url?: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PartnershipInquiry = {
  id: string
  cooperation_type: 'sponsorship' | 'media_partner' | 'other'
  institution_name: string
  contact_person: string
  job_title?: string | null
  industry?: string | null
  scale?: string | null
  email: string
  phone?: string | null
  description: string
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export type InspiratesRecord = {
  id: string
  school_name: string
  activity_date: string
  participant_count: number
  dissemination_members: string[]
  notes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type AuditLog = {
  id: string
  user_id?: string | null
  action: string
  target_table?: string | null
  record_id?: string | null
  metadata?: Record<string, unknown>
  ip_address?: string | null
  created_at: string
}

export type Payment = {
  id: string
  registration_id: string
  provider: 'mock' | 'midtrans'
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded'
  amount: number
  currency: string
  paid_at?: string | null
  expired_at?: string | null
  created_at: string
  updated_at: string
}

export type MidtransTransaction = {
  id: string
  payment_id: string
  order_id: string
  snap_token?: string | null
  redirect_url?: string | null
  transaction_status?: string | null
  fraud_status?: string | null
  gross_amount?: number | null
  raw_response?: Record<string, unknown> | null
  raw_notification?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}
