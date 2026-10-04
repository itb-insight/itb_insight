import { NextResponse, type NextRequest } from 'next/server'

import { apiError } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""'
  const str = String(value).replace(/"/g, '""')
  return `"${str}"`
}

function toCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(',')
}

export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'registrations'
  const supabase = createServiceClient()

  try {
    let filename = `itb-insight-${type}-${new Date().toISOString().split('T')[0]}.csv`
    let csvContent = ''

    if (type === 'registrations') {
      const { data, error } = await supabase
        .from('competition_registrations')
        .select(`
          id,
          registration_kind,
          status,
          submitted_at,
          competitions(name, slug),
          profiles(full_name, email, phone, institution),
          competition_teams(team_uid, team_name)
        `)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      const header = ['ID', 'Kompetisi', 'Jenis', 'Nama Tim / Peserta', 'Email', 'No. HP', 'Institusi', 'Status', 'Tanggal Daftar']
      const rows = (data || []).map((row) => {
        const comp = Array.isArray(row.competitions) ? row.competitions[0] : row.competitions
        const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        const team = Array.isArray(row.competition_teams) ? row.competition_teams[0] : row.competition_teams

        return toCsvRow([
          row.id,
          comp?.name || '',
          row.registration_kind,
          team?.team_name || prof?.full_name || '',
          prof?.email || '',
          prof?.phone || '',
          prof?.institution || '',
          row.status,
          row.submitted_at,
        ])
      })

      csvContent = [toCsvRow(header), ...rows].join('\n')
    } else if (type === 'visitors') {
      const { data, error } = await supabase
        .from('visitor_tickets')
        .select(`
          id,
          qr_code,
          ticket_type,
          checked_in,
          checked_in_at,
          profiles(full_name, email, phone, institution)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const header = ['ID Tiket', 'Nama Pengunjung', 'Email', 'No. HP', 'Institusi', 'Tipe Tiket', 'Status Kehadiran', 'Waktu Check-In']
      const rows = (data || []).map((row) => {
        const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return toCsvRow([
          row.id,
          prof?.full_name || '',
          prof?.email || '',
          prof?.phone || '',
          prof?.institution || '',
          row.ticket_type,
          row.checked_in ? 'Hadir' : 'Belum Hadir',
          row.checked_in_at || '',
        ])
      })

      csvContent = [toCsvRow(header), ...rows].join('\n')
    } else if (type === 'feedback') {
      const { data, error } = await supabase
        .from('feedback_responses')
        .select('id, context, rating, category, comment, created_at, booths(name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const header = ['ID', 'Konteks', 'Booth', 'Rating', 'Kategori', 'Komentar', 'Waktu']
      const rows = (data || []).map((row) => {
        const booth = Array.isArray(row.booths) ? row.booths[0] : row.booths
        return toCsvRow([
          row.id,
          row.context,
          booth?.name || '',
          row.rating,
          row.category || '',
          row.comment || '',
          row.created_at,
        ])
      })

      csvContent = [toCsvRow(header), ...rows].join('\n')
    } else if (type === 'rsvp') {
      const { data, error } = await supabase
        .from('rsvp_invites')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const header = ['ID', 'Nama Undangan', 'Institusi', 'Jabatan', 'Email', 'No. HP', 'Status Kehadiran', 'Nama Pengganti', 'E-Ticket Code', 'Check-In', 'Waktu Konfirmasi']
      const rows = (data || []).map((row) =>
        toCsvRow([
          row.id,
          row.invitee_name,
          row.institution,
          row.position || '',
          row.email,
          row.phone || '',
          row.attendance_status,
          row.substitute_name || '',
          row.e_ticket_code || '',
          row.checked_in ? 'Ya' : 'Belum',
          row.responded_at || '',
        ]),
      )

      csvContent = [toCsvRow(header), ...rows].join('\n')
    } else {
      return apiError('INVALID_TYPE', 'Tipe export tidak valid. Gunakan: registrations, visitors, feedback, rsvp.', 400)
    }

    // SEC-04: Record audit log for sensitive data export
    await recordAuditLog({
      userId: auth.user.id,
      action: `DATA_EXPORT_${type.toUpperCase()}`,
      metadata: { type, exportedBy: auth.user.email },
    })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[API Admin Export Error]', err)
    return apiError('SERVER_ERROR', 'Gagal mengekspor data.', 500)
  }
}
