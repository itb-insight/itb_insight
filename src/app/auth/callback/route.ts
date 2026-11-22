import { NextResponse } from 'next/server'

import { claimPendingSlots } from '@/lib/competition-claims'
import { safeNext } from '@/lib/safe-next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensureVisitorTicket } from '@/lib/tickets'

// OAuth / magic-link landing route. Exchanges the auth code for a session, ensures the
// visitor ticket exists, claims any imported team slot waiting for this email, then redirects
// to the sanitized `next` target.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data } = await supabase.auth.getUser()

      if (data.user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const user = data.user
        // Non-blocking: the dashboard re-runs both, so auth must not fail here.
        await Promise.allSettled([
          ensureVisitorTicket(user.id),
          claimPendingSlots(createServiceClient(), user),
        ])
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth-code', origin))
}
