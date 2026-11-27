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

/** The visitor's phone was detected inside the event zone. */
export const markVisitedItb = (userId: string) => markFlag(userId, 'visited_itb')
