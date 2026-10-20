import { createServiceClient } from '@/lib/supabase/server'
import { type FeedbackResponse } from '@/lib/types/database'

export type SubmitFeedbackParams = {
  context: 'event' | 'booth' | 'inspirates'
  rating: number
  category?: string | null
  comment?: string | null
  boothId?: string | null
  userId?: string | null
  metadata?: Record<string, unknown>
}

export type FeedbackResult =
  | {
      ok: true
      feedback: FeedbackResponse
    }
  | {
      ok: false
      code: 'INVALID_RATING' | 'INVALID_CONTEXT' | 'DATABASE_ERROR'
      message: string
    }

export async function submitFeedback(params: SubmitFeedbackParams): Promise<FeedbackResult> {
  const { context, rating, category, comment, boothId, userId, metadata = {} } = params

  if (!rating || rating < 1 || rating > 5) {
    return { ok: false, code: 'INVALID_RATING', message: 'Rating harus berada di antara 1 dan 5.' }
  }

  if (!['event', 'booth', 'inspirates'].includes(context)) {
    return { ok: false, code: 'INVALID_CONTEXT', message: 'Konteks feedback tidak valid.' }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('feedback_responses')
    .insert({
      context,
      rating,
      category: category || null,
      comment: comment?.trim() || null,
      booth_id: boothId || null,
      user_id: userId || null,
      metadata,
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal menyimpan feedback.' }
  }

  return { ok: true, feedback: data as FeedbackResponse }
}

export async function getFeedbackSummary(context?: 'event' | 'booth' | 'inspirates') {
  const supabase = createServiceClient()
  let query = supabase.from('feedback_responses').select('id, context, rating, category, comment, created_at, booth_id')

  if (context) {
    query = query.eq('context', context)
  }

  const { data, error } = await query
  if (error || !data || data.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentComments: [],
    }
  }

  const total = data.length
  const sum = data.reduce((acc, f) => acc + (f.rating || 0), 0)
  const averageRating = Number((sum / total).toFixed(2))

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  data.forEach((f) => {
    if (f.rating >= 1 && f.rating <= 5) {
      ratingCounts[f.rating] = (ratingCounts[f.rating] || 0) + 1
    }
  })

  const recentComments = data
    .filter((f) => f.comment && f.comment.trim().length > 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map((f) => ({
      id: f.id,
      context: f.context,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.created_at,
    }))

  return {
    total,
    averageRating,
    ratingCounts,
    recentComments,
  }
}
