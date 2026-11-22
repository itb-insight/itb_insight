import 'server-only'

import { getCompetition } from '@/features/competition/data'
import type { Competition } from '@/features/competition/types'
import type { ActivityAction, ActivityEntry, ActivityMember } from '@/features/home/activityTypes'
import { createServiceClient } from '@/lib/supabase/server'

/*
  Builds the "My Activity" card on /dashboard from the user's competition teams (0014). Reads
  with the service role, so every query is scoped here: a user only gets teams they are an active
  member of, and only the leader gets the invite emails of the empty slots.
*/

type ServiceClient = ReturnType<typeof createServiceClient>

type TeamRow = {
  id: string
  team_uid: string
  team_name: string
  status: string
  created_at: string
  competitions: { slug: string; name: string; category: string | null } | null
}

type MemberRow = {
  id: string
  team_id: string
  slot: number | null
  member_role: 'leader' | 'member'
  name: string
  institution: string
  user_id: string | null
  claim_email: string | null
  joined_at: string
}

const ICONS = {
  line: '/images/bg-home/Line.png',
  whatsapp: '/images/bg-home/Whatsapp.png',
  discord: '/images/bg-home/Discord.png',
}

const STATUS_LABELS: Record<string, string | null> = {
  verified: null,
  submitted: 'Menunggu verifikasi',
  draft: 'Belum dikirim',
  rejected: 'Ditolak',
  withdrawn: 'Mengundurkan diri',
}

/** 08xx… → https://wa.me/628xx… */
export function whatsappLink(localNumber: string) {
  const digits = localNumber.replace(/\D/g, '')
  return `https://wa.me/${digits.startsWith('0') ? `62${digits.slice(1)}` : digits}`
}

const isHttps = (url: string | null | undefined): url is string => Boolean(url && /^https:\/\//i.test(url))

/**
 * Contact buttons for a competition's teams, from its public page data
 * (src/features/competition/data.ts). Channels without a link get no button.
 */
export function contactActions(competition: Competition | null): ActivityAction[] {
  if (!competition) return []
  const actions: ActivityAction[] = []

  for (const person of competition.info.contacts ?? []) {
    if (person.line) {
      actions.push({ label: `Line ${person.name}`, href: `https://line.me/ti/p/~${encodeURIComponent(person.line)}`, icon: ICONS.line })
    }
    if (person.whatsapp) {
      actions.push({ label: `WhatsApp ${person.name}`, href: whatsappLink(person.whatsapp), icon: ICONS.whatsapp })
    }
  }

  // Competitions with a single contact person only have contactUrl (e.g. a wa.me link).
  if (!actions.length && isHttps(competition.contactUrl)) {
    const whatsapp = /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(competition.contactUrl)
    actions.push({
      label: whatsapp ? 'WhatsApp Contact Person' : 'Contact Person',
      href: competition.contactUrl,
      icon: whatsapp ? ICONS.whatsapp : null,
    })
  }

  if (isHttps(competition.community?.whatsappGroupUrl)) {
    actions.push({ label: 'Grup Whatsapp', href: competition.community.whatsappGroupUrl, icon: ICONS.whatsapp })
  }
  if (isHttps(competition.community?.discordUrl)) {
    actions.push({ label: 'Channel Discord', href: competition.community.discordUrl, icon: ICONS.discord })
  }

  return actions
}

/** The first timeline stage on or after today (Jakarta date). */
export function nextStage(competition: Competition | null, now: number): ActivityEntry['nextStage'] {
  if (!competition) return null
  const today = new Date(now).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const upcoming = [...competition.timeline].sort((a, b) => a.date.localeCompare(b.date)).find((item) => item.date >= today)
  return upcoming ? { label: upcoming.title, date: upcoming.dateLabel } : null
}

function memberState(member: MemberRow): ActivityMember['state'] {
  if (member.user_id) return 'active'
  return member.claim_email ? 'invited' : 'unclaimed'
}

function bySlot(a: MemberRow, b: MemberRow) {
  if (a.member_role !== b.member_role) return a.member_role === 'leader' ? -1 : 1
  return (a.slot ?? 99) - (b.slot ?? 99) || a.joined_at.localeCompare(b.joined_at)
}

type BuildOptions = {
  now: number
  /** The signed-in viewer; null for an admin preview. */
  viewerUserId: string | null
  /** Admin preview: show the card as the team's leader sees it. */
  viewAsLeader?: boolean
}

/** Cards for the given teams, oldest team first. */
export async function getActivityForTeams(
  supabase: ServiceClient,
  teamIds: string[],
  options: BuildOptions,
): Promise<ActivityEntry[]> {
  if (!teamIds.length) return []

  const [teamsResult, membersResult] = await Promise.all([
    supabase
      .from('competition_teams')
      .select('id, team_uid, team_name, status, created_at, competitions(slug, name, category)')
      .in('id', teamIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('competition_team_members')
      .select('id, team_id, slot, member_role, name, institution, user_id, claim_email, joined_at')
      .in('team_id', teamIds)
      .eq('status', 'active'),
  ])

  if (teamsResult.error) throw new Error(`teams: ${teamsResult.error.message}`)
  if (membersResult.error) throw new Error(`members: ${membersResult.error.message}`)

  const teams = (teamsResult.data ?? []) as unknown as TeamRow[]
  const members = (membersResult.data ?? []) as MemberRow[]

  const slugs = [...new Set(teams.map((team) => team.competitions?.slug).filter((slug): slug is string => Boolean(slug)))]
  const competitions = new Map(await Promise.all(slugs.map(async (slug) => [slug, await getCompetition(slug)] as const)))

  return teams.map((team) => {
    const slug = team.competitions?.slug ?? ''
    const competition = competitions.get(slug) ?? null
    const roster = members.filter((member) => member.team_id === team.id).sort(bySlot)
    const leader = roster.find((member) => member.member_role === 'leader')
    const viewerIsLeader = options.viewAsLeader || Boolean(options.viewerUserId && leader?.user_id === options.viewerUserId)
    const school = team.competitions?.category === 'olimpiade'

    let memberNumber = 0
    const list: ActivityMember[] = roster.map((member) => {
      const isLeader = member.member_role === 'leader'
      if (!isLeader) memberNumber += 1
      return {
        id: member.id,
        slot: member.slot,
        role: isLeader ? 'Ketua:' : `Anggota ${memberNumber}:`,
        name: member.name,
        isLeader,
        isYou: Boolean(options.viewerUserId && member.user_id === options.viewerUserId),
        state: memberState(member),
        ...(viewerIsLeader && !member.user_id ? { inviteEmail: member.claim_email } : {}),
      }
    })

    return {
      teamId: team.id,
      teamUid: team.team_uid,
      competitionSlug: slug,
      competitionName: competition?.title ?? team.competitions?.name ?? 'Lomba',
      badge: 'Lomba',
      statusLabel: STATUS_LABELS[team.status] ?? null,
      withdrawn: team.status === 'withdrawn',
      viewerIsLeader,
      teamName: team.team_name,
      institution: `${school ? 'Sekolah' : 'Institusi'}: ${leader?.institution ?? roster[0]?.institution ?? '-'}`,
      members: list,
      nextStage: team.status === 'withdrawn' ? null : nextStage(competition, options.now),
      actions: contactActions(competition),
    }
  })
}

/** The signed-in user's teams (only those they are still an active member of). */
export async function getActivityForUser(supabase: ServiceClient, userId: string, now: number) {
  const { data, error } = await supabase
    .from('competition_team_members')
    .select('team_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) throw new Error(`memberships: ${error.message}`)
  const teamIds = [...new Set((data ?? []).map((row) => row.team_id as string))]
  return getActivityForTeams(supabase, teamIds, { now, viewerUserId: userId })
}
