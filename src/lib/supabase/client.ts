import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client (anon key, RLS-respecting). Safe for client components.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
