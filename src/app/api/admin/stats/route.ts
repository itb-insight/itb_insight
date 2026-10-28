import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { getLiveVisitorStats } from '@/lib/check-in'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const supabase = createServiceClient()

    // 1. Visitor Tickets, Live Visitor Count (Entry/Exit), & Gate Check-ins
    const visitorStats = await getLiveVisitorStats()

    // 2. Booth Scans
    const { count: totalBoothScans } = await supabase
      .from('booth_scan_events')
      .select('*', { count: 'exact', head: true })

    // 3. Competition Registrations
    const { count: totalRegistrations } = await supabase
      .from('competition_registrations')
      .select('*', { count: 'exact', head: true })

    const { count: verifiedRegistrations } = await supabase
      .from('competition_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')

    // 4. Feedback
    const { data: feedbackData } = await supabase
      .from('feedback_responses')
      .select('rating')

    const totalFeedback = feedbackData?.length || 0
    const averageRating =
      totalFeedback > 0
        ? Number(
            (
              (feedbackData || []).reduce((acc, curr) => acc + (curr.rating || 0), 0) /
              totalFeedback
            ).toFixed(2),
          )
        : 0

    // 5. Inquiries
    const { count: totalInquiries } = await supabase
      .from('partnership_inquiries')
      .select('*', { count: 'exact', head: true })

    return apiSuccess({
      visitors: {
        totalTickets: visitorStats.totalTickets,
        checkedIn: visitorStats.checkedIn,
        liveVisitorCount: visitorStats.liveVisitorCount,
        gateConfirmedCount: visitorStats.gateConfirmedCount,
        gateConversionRate:
          visitorStats.totalTickets > 0
            ? Number(((visitorStats.checkedIn / visitorStats.totalTickets) * 100).toFixed(1))
            : 0,
      },
      booths: {
        totalScans: totalBoothScans || 0,
      },
      competitions: {
        totalRegistrations: totalRegistrations || 0,
        verifiedRegistrations: verifiedRegistrations || 0,
      },
      feedback: {
        total: totalFeedback,
        averageRating,
      },
      partnerships: {
        totalInquiries: totalInquiries || 0,
      },
    })
  } catch (err) {
    console.error('[API Admin Stats Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat analitik dashboard admin.', 500)
  }
}
