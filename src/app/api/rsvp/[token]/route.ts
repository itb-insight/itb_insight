import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getRsvpInviteByToken, submitRsvpResponse } from '@/lib/rsvp'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    if (!token) {
      return apiError('INVALID_TOKEN', 'Token undangan tidak valid.', 400)
    }

    const invite = await getRsvpInviteByToken(token)
    if (!invite) {
      return apiError('INVITE_NOT_FOUND', 'Undangan tidak ditemukan atau link sudah kedaluwarsa.', 404)
    }

    return apiSuccess({
      inviteeName: invite.invitee_name,
      institution: invite.institution,
      position: invite.position,
      email: invite.email,
      phone: invite.phone,
      attendanceStatus: invite.attendance_status,
      substituteName: invite.substitute_name,
      eTicketCode: invite.e_ticket_code,
      checkedIn: invite.checked_in,
      respondedAt: invite.responded_at,
    })
  } catch (err) {
    console.error('[API RSVP GET Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat data undangan.', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { attendanceStatus, substituteName, phone } = body

    if (!['attending', 'not_attending', 'represented'].includes(attendanceStatus)) {
      return apiError('INVALID_INPUT', 'Status kehadiran harus "attending", "not_attending", atau "represented".', 400)
    }

    const result = await submitRsvpResponse({
      token,
      attendanceStatus,
      substituteName,
      phone,
    })

    if (!result.ok) {
      return apiError(result.code, result.message, 400)
    }

    return apiSuccess({
      message: 'Konfirmasi kehadiran berhasil dicatat. Terima kasih!',
      invite: {
        inviteeName: result.invite.invitee_name,
        attendanceStatus: result.invite.attendance_status,
        substituteName: result.invite.substitute_name,
        eTicketCode: result.invite.e_ticket_code,
        respondedAt: result.invite.responded_at,
      },
    })
  } catch (err) {
    console.error('[API RSVP POST Error]', err)
    return apiError('SERVER_ERROR', 'Gagal mengirim konfirmasi kehadiran.', 500)
  }
}
