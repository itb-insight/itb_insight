import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import FeedbackPageDialog from '@/features/feedback/FeedbackPageDialog'
import LandingPageHifi from '@/features/landing/components/LandingPageHifi/LandingPageHifi'
import { getFeedbackFormBySlug, toPublicForm } from '@/lib/feedback/forms'

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

// Cached and shared by everyone who scans the QR (ISR): no cookies or per-user data here. The
// dialog loads the visitor's name/email and the live open/closed state from the API.
export const revalidate = 60

// Forms live in the database: render each slug on its first request, then serve it from cache.
export async function generateStaticParams() {
  return []
}

export default async function FeedbackPage({ params }: PageProps) {
  const { slug } = await params
  const form = await getFeedbackFormBySlug(slug)
  if (!form || !form.isActive) notFound()

  return (
    <>
      <LandingPageHifi />
      <FeedbackPageDialog form={toPublicForm(form)} />
    </>
  )
}
