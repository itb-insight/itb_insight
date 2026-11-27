import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'

/*
  Insight Arcade runtime state (public.arcade_settings, migration 0030): the game window, the kill
  switch and results publication. The database enforces all of it (trigger arcade_guard and
  function arcade_award_booth); this module only reads it for pages and messages.
*/

export type ArcadeSettings = {
  opensAt: string
  freezesAt: string
  claimsCloseAt: string
  syncGraceMinutes: number
  pausedAt: string | null
  resultsPublishedAt: string | null
}

export type ArcadeWindow = 'not_started' | 'open' | 'frozen'

export async function getArcadeSettings(): Promise<ArcadeSettings | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const { data, error } = await createServiceClient()
    .from('arcade_settings')
    .select('opens_at, freezes_at, claims_close_at, sync_grace_minutes, paused_at, results_published_at')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data) {
    if (error) console.error('[arcade] settings read failed', error)
    return null
  }
  return {
    opensAt: data.opens_at as string,
    freezesAt: data.freezes_at as string,
    claimsCloseAt: data.claims_close_at as string,
    syncGraceMinutes: data.sync_grace_minutes as number,
    pausedAt: (data.paused_at as string | null) ?? null,
    resultsPublishedAt: (data.results_published_at as string | null) ?? null,
  }
}

export function arcadeWindow(settings: Pick<ArcadeSettings, 'opensAt' | 'freezesAt'>, now: Date = new Date()): ArcadeWindow {
  if (now.getTime() < new Date(settings.opensAt).getTime()) return 'not_started'
  if (now.getTime() > new Date(settings.freezesAt).getTime()) return 'frozen'
  return 'open'
}

/** "06:00" in WIB. */
export function wibClock(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
    .format(new Date(iso))
    .replace('.', ':')
}
