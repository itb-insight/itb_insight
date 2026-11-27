import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'

/*
  profiles.entered_gate / profiles.visited_itb (migration 0026). Each only goes false -> true:
  the update matches `= false`, so repeating it is a no-op and leaving the area never resets it.
*/

type VisitFlag = 'entered_gate' | 'visited_itb'

/** Sets the flag. True when this call flipped it (the first time), false when it was already set. */
async function markFlag(userId: string, flag: VisitFlag): Promise<boolean> {
  const { data, error } = await createServiceClient()
    .from('profiles')
    .update({ [flag]: true })
    .eq('id', userId)
    .eq(flag, false)
    .select('id')
  if (error) throw new Error(error.message)
  return Array.isArray(data) && data.length > 0
}

/** The visitor's QR was scanned at the gate by gate staff / an admin. */
export const markEnteredGate = (userId: string) => markFlag(userId, 'entered_gate')

/** Most people one visitor can represent (profiles.represented_count check, 0027). */
export const MAX_REPRESENTED = 200

/**
 * How many people besides the account holder this visitor represents (parents, teachers). Set at
 * the gate; replaces the previous value so staff can correct a mistake.
 */
export async function setRepresentedCount(userId: string, count: number): Promise<void> {
  const { error } = await createServiceClient().from('profiles').update({ represented_count: count }).eq('id', userId)
  if (error) throw new Error(error.message)
}

/** The visitor's phone was detected inside the event zone. */
export const markVisitedItb = (userId: string) => markFlag(userId, 'visited_itb')

/**
 * The visitor's phone reported being outside the event zone (POST /api/presence/exit):
 * profiles.left_area_at (0028). Time only, no location. The /admin/d-day headcount stops counting
 * them until their next in-area signal (gate check-in, booth scan, presence ping).
 */
export async function markLeftArea(userId: string): Promise<void> {
  const { error } = await createServiceClient()
    .from('profiles')
    .update({ left_area_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}
