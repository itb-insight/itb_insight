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

    const count = (table: string, filter?: [string, unknown]) => {
      const query = supabase.from(table).select('*', { count: 'exact', head: true })
      return filter ? query.eq(filter[0], filter[1]) : query
    }

    // Independent queries: run them together instead of one round trip after another.
    const [
      { count: totalTickets },
      { count: checkedInTickets },
      { count: totalBoothScans },
      { count: totalRegistrations },
      { count: verifiedRegistrations },
      { count: totalInquiries },
      feedbackSummaries,
    ] = await Promise.all([
      count('visitor_tickets'),
      count('visitor_tickets', ['checked_in', true]),
      count('booth_scan_events'),
      count('competition_registrations'),
      count('competition_registrations', ['status', 'verified']),
      count('partnership_inquiries'),
      getFeedbackSummaries(),
    ])

    // Feedback, weighted across forms by number of overall ratings
    const totalFeedback = feedbackSummaries.reduce((acc, f) => acc + f.total, 0)
    const ratedCount = feedbackSummaries.reduce((acc, f) => acc + f.ratedCount, 0)
    const ratedSum = feedbackSummaries.reduce((acc, f) => acc + (f.averageRating ?? 0) * f.ratedCount, 0)
    const averageRating = ratedCount > 0 ? Number((ratedSum / ratedCount).toFixed(2)) : 0

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
