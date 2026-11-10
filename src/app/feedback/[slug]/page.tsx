import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import FeedbackForm, { type FeedbackAccount } from '@/features/feedback/FeedbackForm'
import { getFeedbackFormBySlug, toPublicForm } from '@/lib/feedback/forms'
import { type Answers } from '@/lib/feedback/schema'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const form = await getFeedbackFormBySlug(slug)
  return {
    title: form?.title ?? 'Feedback',
    // Feedback links are distributed by QR; they have no business in search results.
    robots: { index: false, follow: false },
  }
}

async function getAccount(): Promise<FeedbackAccount | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', data.user.id)
    .maybeSingle()

  return {
    name: profile?.full_name ?? '',
    email: profile?.email ?? data.user.email ?? '',
  }
}

export default async function FeedbackPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const form = await getFeedbackFormBySlug(slug)
  if (!form || !form.isActive) notFound()

  // Choice answers can be pre-selected from the URL, e.g. a per-school QR code:
  // /feedback/inspirates-2026?school=sman-1-bandung. Unknown values are ignored.
  const query = await searchParams
  const prefill: Answers = {}
  for (const q of form.questions) {
    const value = query[q.id]
    if (q.type === 'choice' && typeof value === 'string' && q.options.some((o) => o.value === value)) {
      prefill[q.id] = value
    }
  }

  return (
    <FeedbackForm
      form={toPublicForm(form)}
      account={await getAccount()}
      prefill={prefill}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
    />
  )
}
