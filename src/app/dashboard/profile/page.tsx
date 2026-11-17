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
  
  // The personal QR encodes the visitor ticket token. Ensuring it here covers accounts
  // created before tickets were issued at sign-in; it is created once and reused after.
  const [{ data: profile }, ticket] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone, institution')
      .eq('id', user.id)
      .maybeSingle(),
    ensureVisitorTicket(user.id),
  ])

  return(
    <ProfileCard qrToken={ticket.ok ? ticket.ticket.qr_code : null} initial={{
      full_name:   profile?.full_name   || (user.user_metadata?.full_name as string | undefined) || '',
      email:       user.email           || profile?.email || '',
      phone:       profile?.phone       ?? '',
      institution: profile?.institution ?? '',
    }} />

  )
}