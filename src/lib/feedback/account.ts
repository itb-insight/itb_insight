import { createServiceClient } from '@/lib/supabase/server'

export type SubmitterAccount = { id: string; email?: string | null }

/** Name and email a signed-in user submits feedback as. Read from profiles, never from the client. */
export type FeedbackAccount = { name: string; email: string }

export async function resolveAccountIdentity(account: SubmitterAccount): Promise<FeedbackAccount> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('profiles').select('full_name, email').eq('id', account.id).maybeSingle()
  return {
    name: (data?.full_name as string | undefined) ?? '',
    email: (data?.email as string | undefined) ?? account.email ?? '',
  }
}
