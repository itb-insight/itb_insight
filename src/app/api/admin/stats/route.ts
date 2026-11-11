import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { getFeedbackSummaries } from '@/lib/feedback/summary'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const supabase = createServiceClient()

    // 1. Visitor Tickets & Gate Check-ins
    const { count: totalTickets } = await supabase
      .from('visitor_tickets')
      .select('*', { count: 'exact', head: true })

    const { count: checkedInTickets } = await supabase
      .from('visitor_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('checked_in', true)

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

    // 4. Feedback (weighted across forms by number of overall ratings)
    const feedbackSummaries = await getFeedbackSummaries()
    const totalFeedback = feedbackSummaries.reduce((acc, f) => acc + f.total, 0)
    const ratedCount = feedbackSummaries.reduce((acc, f) => acc + f.ratedCount, 0)
    const ratedSum = feedbackSummaries.reduce((acc, f) => acc + (f.averageRating ?? 0) * f.ratedCount, 0)
    const averageRating = ratedCount > 0 ? Number((ratedSum / ratedCount).toFixed(2)) : 0

    // 5. Inquiries
    const { count: totalInquiries } = await supabase
      .from('partnership_inquiries')
      .select('*', { count: 'exact', head: true })

    return apiSuccess({
      visitors: {
        totalTickets: totalTickets || 0,
        checkedIn: checkedInTickets || 0,
        gateConversionRate:
          totalTickets && totalTickets > 0
            ? Number((((checkedInTickets || 0) / totalTickets) * 100).toFixed(1))
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
