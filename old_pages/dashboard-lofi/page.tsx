import DashboardHome from "@/features/dashboard/DashboardHome"
import { getRegistrations } from "@/lib/registrations"
import { createClient } from "@/lib/supabase/server"
import { ensureVisitorTicket } from "@/lib/tickets"

export const dynamic = "force-dynamic"

async function getAccount() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const ticket = await ensureVisitorTicket(user.id)
    return { id: user.id, email: user.email ?? null, qrToken: ticket.ok ? ticket.ticket.qr_code : null }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const [registrations, account] = await Promise.all([getRegistrations(), getAccount()])
  return <DashboardHome registrations={registrations} account={account} />
}
