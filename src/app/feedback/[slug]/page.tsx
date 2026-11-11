import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import FeedbackPageDialog from '@/features/feedback/FeedbackPageDialog'
import LandingPageHifi from '@/features/landing/components/LandingPageHifi/LandingPageHifi'
import { resolveAccountIdentity, type FeedbackAccount } from '@/lib/feedback/account'
import { getFeedbackFormBySlug, toPublicForm } from '@/lib/feedback/forms'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{ slug: string }>
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
  return data.user ? resolveAccountIdentity({ id: data.user.id, email: data.user.email }) : null
}

export default async function FeedbackPage({ params }: PageProps) {
  const { slug } = await params
  const form = await getFeedbackFormBySlug(slug)
  if (!form || !form.isActive) notFound()

  return (
    <>
      <LandingPageHifi />
      <FeedbackPageDialog form={toPublicForm(form)} account={await getAccount()} />
    </>
  )
}
