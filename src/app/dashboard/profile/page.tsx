import { redirect } from "next/navigation";
import ProfileCard from "@/features/profile/ProfileCard"
import { createClient } from "@/lib/supabase/server";
import { ensureVisitorTicket } from "@/lib/tickets";

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Profile | ITB Insight',
  description: 'Your personal profile page.',
};

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, institution')
    .eq('id', user.id)
    .maybeSingle()

  let personalQrValue = user.id
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const ticketRes = await ensureVisitorTicket(user.id)
    if (ticketRes.ok && ticketRes.ticket?.qr_code) {
      personalQrValue = ticketRes.ticket.qr_code
    }
  } else {
    const { data: existingTicket } = await supabase
      .from('visitor_tickets')
      .select('qr_code')
      .eq('user_id', user.id)
      .maybeSingle()
    if (existingTicket?.qr_code) {
      personalQrValue = existingTicket.qr_code
    }
  }
  
  return(
    <ProfileCard
      initial={{
        full_name:   profile?.full_name   || (user.user_metadata?.full_name as string | undefined) || '',
        email:       user.email           || profile?.email || '',
        phone:       profile?.phone       ?? '',
        institution: profile?.institution ?? '',
      }}
      qrValue={personalQrValue}
    />
  )
}
