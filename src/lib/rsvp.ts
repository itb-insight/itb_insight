import { randomBytes } from 'crypto'

import { createServiceClient } from '@/lib/supabase/server'
import { type RSVPInvite } from '@/lib/types/database'
import { recordAuditLog } from '@/lib/audit'

export function generateRsvpToken() {
  return randomBytes(16).toString('hex')
}

export function generateRsvpTicketCode() {
  return `RSVP-${randomBytes(8).toString('hex').toUpperCase()}`
}

export async function getRsvpInviteByToken(token: string): Promise<RSVPInvite | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('rsvp_invites')
    .select('*')
    .eq('token', token.trim())
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as RSVPInvite
}

export type SubmitRsvpParams = {
  token: string
  attendanceStatus: 'attending' | 'not_attending' | 'represented'
  substituteName?: string | null
  phone?: string | null
}

export type SubmitRsvpResult =
  | {
      ok: true
      invite: RSVPInvite
    }
  | {
      ok: false
      code: 'INVITE_NOT_FOUND' | 'INVALID_INPUT' | 'DATABASE_ERROR'
      message: string
    }

export async function submitRsvpResponse(params: SubmitRsvpParams): Promise<SubmitRsvpResult> {
  const { token, attendanceStatus, substituteName, phone } = params

  if (!token) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Token undangan tidak valid.' }
  }

  if (attendanceStatus === 'represented' && (!substituteName || !substituteName.trim())) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Nama pengganti wajib diisi jika kehadiran diwakilkan.' }
  }

  const existing = await getRsvpInviteByToken(token)
  if (!existing) {
    return { ok: false, code: 'INVITE_NOT_FOUND', message: 'Undangan tidak ditemukan.' }
  }

  const now = new Date().toISOString()
  const ticketCode = existing.e_ticket_code || generateRsvpTicketCode()

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('rsvp_invites')
    .update({
      attendance_status: attendanceStatus,
      substitute_name: attendanceStatus === 'represented' ? substituteName?.trim() : null,
      phone: phone ? phone.trim() : existing.phone,
      e_ticket_code: ticketCode,
      responded_at: now,
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error || !data) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal memperbarui konfirmasi kehadiran.' }
  }

  await recordAuditLog({
    action: 'RSVP_RESPONSE_SUBMITTED',
    targetTable: 'rsvp_invites',
    recordId: existing.id,
    metadata: {
      inviteeName: existing.invitee_name,
      attendanceStatus,
      substituteName,
    },
  })

  return { ok: true, invite: data as RSVPInvite }
}
