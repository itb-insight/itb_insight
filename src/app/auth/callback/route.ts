import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { ensureVisitorTicket } from '@/lib/tickets'

// OAuth / magic-link landing route. Exchanges the auth code for a session, ensures the
// visitor ticket exists, then redirects to the sanitized `next` target.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data } = await supabase.auth.getUser()

      if (data.user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await ensureVisitorTicket(data.user.id)
        } catch {
          // Non-blocking: the dashboard re-ensures the ticket, so auth must not fail here.
        }
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth-code', origin))
}
