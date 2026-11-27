import 'server-only'

import { unstable_cache } from 'next/cache'

import { adminEmailList } from '@/lib/admin'
import { BOOTH_CATEGORIES } from '@/lib/booth-points'
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

// ---- board and player summary (wave 1b) --------------------------------------------------------


export type BoardEntry = { rank: number; userId: string; name: string; institution: string | null; points: number; lastAt: string }
export type ArcadeBoard = { players: number; entries: BoardEntry[] }

/** Every ranked player (public.arcade_leaderboard, 0031). Cached 15 s per instance. */
export const getArcadeBoard = unstable_cache(
  async (): Promise<ArcadeBoard> => {
    const { data, error } = await createServiceClient().rpc('arcade_leaderboard', { p_admin_emails: adminEmailList() })
    if (error) throw new Error(`arcade_leaderboard: ${error.message}`)
    const board = (data ?? {}) as { players?: number; entries?: BoardEntry[] }
    return { players: board.players ?? 0, entries: board.entries ?? [] }
  },
  ['arcade-board'],
  { revalidate: 15, tags: ['arcade-board'] },
)

export type AreaBooth = { id: string; name: string; location: string | null; points: number; visited: boolean }
export type ArcadeArea = { category: string; label: string; visited: number; total: number; booths: AreaBooth[] }
export type ArcadeSideQuest = {
  slug: string
  title: string
  description: string | null
  points: number
  verify: string
  shortcutUrl: string | null
  status: 'todo' | 'review' | 'done' | 'rejected'
}
export type ArcadeCollection = { slug: string; title: string; description: string | null; bonus: number; progress: number; total: number }
export type ArcadePlayer = {
  committee: boolean
  points: number
  rank: number | null
  players: number
  top10Points: number | null
  areas: ArcadeArea[]
  sideQuests: ArcadeSideQuest[]
  collections: ArcadeCollection[]
}

export async function getArcadePlayer(userId: string): Promise<ArcadePlayer> {
  const supabase = createServiceClient()
  const [board, committee, booths, visits, quests, subs, cols] = await Promise.all([
    getArcadeBoard(),
    supabase.rpc('arcade_is_committee', { p_user: userId, p_admin_emails: adminEmailList() }),
    supabase.from('booths').select('id, name, category, location_name, points').eq('is_active', true).order('slug'),
    supabase.from('booth_scan_events').select('booth_id').eq('user_id', userId).eq('kind', 'visit'),
    supabase
      .from('sidequests')
      .select('id, slug, title, description, points, verify, shortcut_url')
      .eq('is_active', true)
      .like('slug', 'arcade-%')
      .order('order_index'),
    supabase.from('sidequest_submissions').select('quest_id, status').eq('user_id', userId),
    supabase.from('arcade_collections').select('slug, title, description, rule, categories, min_total, min_per_category, bonus').eq('is_active', true).order('order_index'),
  ])

  const visited = new Set(((visits.data ?? []) as Array<{ booth_id: string }>).map((v) => v.booth_id))
  const boothRows = (booths.data ?? []) as Array<{ id: string; name: string; category: string; location_name: string | null; points: number }>
  const areas: ArcadeArea[] = BOOTH_CATEGORIES.map((c) => {
    const list = boothRows
      .filter((b) => b.category === c.id)
      .map((b) => ({ id: b.id, name: b.name, location: b.location_name, points: b.points, visited: visited.has(b.id) }))
    return { category: c.id, label: c.label, visited: list.filter((b) => b.visited).length, total: list.length, booths: list }
  }).filter((a) => a.total > 0)

  const statusByQuest = new Map(((subs.data ?? []) as Array<{ quest_id: string; status: string }>).map((s) => [s.quest_id, s.status]))
  const sideQuests: ArcadeSideQuest[] = ((quests.data ?? []) as Array<{
    id: string
    slug: string
    title: string
    description: string | null
    points: number
    verify: string
    shortcut_url: string | null
  }>).map((q) => {
    const s = statusByQuest.get(q.id)
    return {
      slug: q.slug,
      title: q.title,
      description: q.description,
      points: q.points,
      verify: q.verify,
      shortcutUrl: q.shortcut_url,
      status: s === 'approved' ? 'done' : s === 'pending' ? 'review' : s === 'rejected' ? 'rejected' : 'todo',
    }
  })

  const visitedCats = boothRows.filter((b) => visited.has(b.id)).map((b) => b.category)
  const collections: ArcadeCollection[] = ((cols.data ?? []) as Array<{
    slug: string
    title: string
    description: string | null
    rule: string
    categories: string[]
    min_total: number | null
    min_per_category: number | null
    bonus: number
  }>).map((c) => {
    if (c.rule === 'count_in') {
      const n = visitedCats.filter((cat) => c.categories.includes(cat)).length
      return { slug: c.slug, title: c.title, description: c.description, bonus: c.bonus, progress: Math.min(n, c.min_total ?? 1), total: c.min_total ?? 1 }
    }
    const per = c.min_per_category ?? 1
    const n = c.categories.filter((cat) => visitedCats.filter((v) => v === cat).length >= per).length
    return { slug: c.slug, title: c.title, description: c.description, bonus: c.bonus, progress: n, total: c.categories.length }
  })

  const me = board.entries.find((e) => e.userId === userId)
  return {
    committee: committee.data === true,
    points: me?.points ?? 0,
    rank: me?.rank ?? null,
    players: board.players,
    top10Points: board.entries[9]?.points ?? null,
    areas,
    sideQuests,
    collections,
  }
}
