import { redirect } from "next/navigation";
import ProfileCard from "@/features/profile/ProfileCard"
import { createClient } from "@/lib/supabase/server";

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
  
  return(
    <ProfileCard initial={{
      full_name:   profile?.full_name   || (user.user_metadata?.full_name as string | undefined) || '',
      email:       user.email           || profile?.email || '',
      phone:       profile?.phone       ?? '',
      institution: profile?.institution ?? '',
    }} />

  )
}