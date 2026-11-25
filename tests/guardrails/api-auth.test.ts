import { describe, expect, it } from 'vitest'

import { listFiles, readText } from '../support/repo'

/*
  Every API route handler must authenticate its caller, unless it is listed below as
  deliberately public together with the control that protects it instead. Adding a route
  without auth fails this test, so going public is a decision made in review, not by accident.

  The check is textual: a handler "authenticates" when its body calls one of the helpers in
  AUTH_CALL. Keep auth calls inside the exported handler (not in a helper defined elsewhere).
*/

const AUTH_CALL = /\b(?:getAuthenticatedUser|getScopedUser|getAdminUser)\s*\(/
const ROLE_CALL = /\b(?:getScopedUser|getAdminUser)\s*\(/

/** "METHOD /api/path" -> what protects it instead of a session. */
const PUBLIC_HANDLERS: Record<string, string> = {
  'GET /api/booths': 'Read-only directory of active booths.',
  'GET /api/partners': 'Read-only sponsor wall.',
  'POST /api/partners/inquiry': 'Disabled: always 404 until the partnership form ships.',
  'GET /api/feedback/[slug]': 'Public form definition; sign-in is optional.',
  'POST /api/feedback/[slug]': 'Sign-in optional; rate limit, honeypot, min fill time, Turnstile.',
  'GET /api/rsvp/[token]': 'Capability URL: 128-bit random token.',
  'POST /api/rsvp/[token]': 'Capability URL: 128-bit random token.',
  'POST /api/payments/webhook': 'Midtrans SHA-512 signature (verifyMidtransSignature) and amount check.',
  'POST /api/track': 'Anonymous analytics ingest: rate limited, PII keys stripped.',
  'GET /api/sidequests/leaderboard': 'Public read-only gamification leaderboard (committee accounts excluded).',
}

/** Staff and admin surfaces: a session alone is not enough, the handler must check the role. */
const ROLE_REQUIRED_PREFIXES = ['/api/admin/']
const ROLE_REQUIRED_HANDLERS = [
  'POST /api/check-in/scan',
  'POST /api/check-in/manual',
  'POST /api/booths/scan',
  'GET /api/feedback',
]
const ROLE_EXCEPTIONS: Record<string, string> = {}

const METHODS = 'GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS'
const HANDLER_START = new RegExp(`^export\\s+(?:async\\s+function|function|const|let)\\s+(${METHODS})\\b`, 'gm')
const RE_EXPORTED_HANDLER = new RegExp(`export\\s*\\{[^}]*\\bas\\s+(?:${METHODS})\\b`)

type Handler = { key: string; file: string; body: string }

function routePath(file: string): string {
  const segments = file
    .replace(/^src\/app\//, '')
    .replace(/\/route\.(?:ts|tsx|js)$/, '')
    .split('/')
    .filter((segment) => !/^\(.*\)$/.test(segment)) // route groups do not appear in the URL
  return `/${segments.join('/')}`
}

function handlersOf(file: string): Handler[] {
  const text = readText(file)
  if (RE_EXPORTED_HANDLER.test(text)) {
    throw new Error(`${file}: export each handler as a named function so this guardrail can read it`)
  }
  const starts = [...text.matchAll(HANDLER_START)]
  return starts.map((match, i) => ({
    key: `${match[1]} ${routePath(file)}`,
    file,
    // From this export to the next one: the handler plus any helpers declared right after it.
    body: text.slice(match.index, starts[i + 1]?.index ?? text.length),
  }))
}

const handlers = listFiles('src/app/api', /^route\.(?:ts|tsx|js)$/).flatMap(handlersOf)
const handlerKeys = new Set(handlers.map((handler) => handler.key))

const needsRole = (key: string) =>
  ROLE_REQUIRED_HANDLERS.includes(key) || ROLE_REQUIRED_PREFIXES.some((prefix) => key.split(' ')[1].startsWith(prefix))

describe('guardrail: API route authentication', () => {
  it('finds the route handlers', () => {
    expect(handlers.length).toBeGreaterThan(20)
  })

  it('every handler authenticates the caller or is listed as deliberately public', () => {
    const unauthenticated = handlers
      .filter((handler) => !AUTH_CALL.test(handler.body) && !(handler.key in PUBLIC_HANDLERS))
      .map((handler) => `${handler.key}  (${handler.file})`)

    expect(
      unauthenticated,
      'Call getAuthenticatedUser/getScopedUser in the handler, or add it to PUBLIC_HANDLERS with what protects it',
    ).toEqual([])
  })

  it('staff and admin handlers check the role, not just the session', () => {
    const missingRoleCheck = handlers
      .filter((handler) => needsRole(handler.key) && !ROLE_CALL.test(handler.body) && !(handler.key in ROLE_EXCEPTIONS))
      .map((handler) => `${handler.key}  (${handler.file})`)

    expect(missingRoleCheck, 'Use getScopedUser(request, [roles]) for staff/admin handlers').toEqual([])
  })

  it('allowlists only name handlers that exist', () => {
    const named = [...Object.keys(PUBLIC_HANDLERS), ...Object.keys(ROLE_EXCEPTIONS), ...ROLE_REQUIRED_HANDLERS]
    expect(named.filter((key) => !handlerKeys.has(key)), 'Remove stale entries').toEqual([])
  })

  it('"pending review" entries are removed once the handler is fixed', () => {
    const fixed = handlers.filter(
      (handler) =>
        (PUBLIC_HANDLERS[handler.key]?.startsWith('Pending review') && AUTH_CALL.test(handler.body)) ||
        (handler.key in ROLE_EXCEPTIONS && ROLE_CALL.test(handler.body)),
    )
    expect(fixed.map((handler) => handler.key), 'This handler now authenticates: delete its allowlist entry').toEqual([])
  })
})
