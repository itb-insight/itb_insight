import { describe, expect, it } from 'vitest'

import { listFiles, readText } from '../support/repo'

/*
  Replays supabase/migrations in order and checks the resulting schema, because the anon key is
  public: RLS and grants are the only thing between the internet and these tables.

  - every table in `public` has row level security enabled
  - no write policy (insert/update/delete/all) lets a caller write without an auth.uid()-bound
    condition (writes go through API routes with the service role instead)
  - no write grants to `anon`
  - every SECURITY DEFINER function pins search_path
  - every view in `public` is security_invoker or revoked from anon and authenticated
  - migration version prefixes are unique (the Supabase CLI keys applied migrations by them)
*/

/** "table: policy name" -> why it is allowed. */
const WRITE_POLICY_EXCEPTIONS: Record<string, string> = {}

/** Version prefix -> why the duplicate is tolerated. Never add new ones. */
const KNOWN_DUPLICATE_VERSIONS: Record<string, string> = {
  '0007': 'Already applied; renaming would re-run it. Verify both 0007 files ran in every environment.',
}

const files = listFiles('supabase/migrations', /\.sql$/)

const stripComments = (sql: string) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '')
const objectName = (qualified: string) => qualified.replace(/"/g, '').replace(/^public\./i, '').toLowerCase()
const isPublic = (qualified: string) => !qualified.includes('.') || /^"?public"?\./i.test(qualified)

type Event =
  | { kind: 'createTable' | 'dropTable' | 'enableRls'; name: string }
  | { kind: 'createPolicy'; name: string; table: string; body: string }
  | { kind: 'dropPolicy'; name: string; table: string }
  | { kind: 'createFunction'; name: string; attributes: string }
  | { kind: 'dropFunction'; name: string }
  | { kind: 'createView'; name: string; definition: string }
  | { kind: 'revoke'; name: string; roles: string }
  | { kind: 'grant'; privileges: string; target: string; roles: string }

function eventsOf(sql: string): Array<{ index: number; event: Event }> {
  const text = stripComments(sql)
  const out: Array<{ index: number; event: Event }> = []
  const scan = (pattern: RegExp, toEvent: (m: RegExpMatchArray) => Event | null) => {
    for (const match of text.matchAll(pattern)) {
      const event = toEvent(match)
      if (event) out.push({ index: match.index ?? 0, event })
    }
  }
  const NAME = '((?:"?\\w+"?\\.)?"?\\w+"?)'

  scan(new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?${NAME}`, 'gi'), (m) =>
    isPublic(m[1]) ? { kind: 'createTable', name: objectName(m[1]) } : null,
  )
  scan(new RegExp(`drop\\s+table\\s+(?:if\\s+exists\\s+)?${NAME}`, 'gi'), (m) => ({ kind: 'dropTable', name: objectName(m[1]) }))
  scan(new RegExp(`alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?${NAME}\\s+enable\\s+row\\s+level\\s+security`, 'gi'), (m) => ({
    kind: 'enableRls',
    name: objectName(m[1]),
  }))
  scan(new RegExp(`create\\s+policy\\s+"([^"]+)"\\s+on\\s+${NAME}([\\s\\S]*?);`, 'gi'), (m) => ({
    kind: 'createPolicy',
    name: m[1],
    table: objectName(m[2]),
    body: m[3],
  }))
  scan(new RegExp(`drop\\s+policy\\s+(?:if\\s+exists\\s+)?"([^"]+)"\\s+on\\s+${NAME}`, 'gi'), (m) => ({
    kind: 'dropPolicy',
    name: m[1],
    table: objectName(m[2]),
  }))
  scan(new RegExp(`drop\\s+function\\s+(?:if\\s+exists\\s+)?${NAME}`, 'gi'), (m) => ({ kind: 'dropFunction', name: m[1].toLowerCase() }))
  scan(new RegExp(`create\\s+(?:or\\s+replace\\s+)?view\\s+${NAME}([\\s\\S]*?);`, 'gi'), (m) =>
    isPublic(m[1]) ? { kind: 'createView', name: objectName(m[1]), definition: m[2] } : null,
  )
  scan(new RegExp(`revoke\\s+[^;]*?\\s+on\\s+(?:table\\s+)?${NAME}\\s+from\\s+([^;]+);`, 'gi'), (m) => ({
    kind: 'revoke',
    name: objectName(m[1]),
    roles: m[2].toLowerCase(),
  }))
  scan(/grant\s+([^;]*?)\s+on\s+([^;]*?)\s+to\s+([^;]+);/gi, (m) => ({
    kind: 'grant',
    privileges: m[1].toLowerCase(),
    target: m[2].toLowerCase(),
    roles: m[3].toLowerCase(),
  }))

  // Functions: attributes (language, security definer, search_path) may sit before or after the
  // $$ body, so collect the text outside the body up to the closing semicolon.
  for (const match of text.matchAll(new RegExp(`create\\s+(?:or\\s+replace\\s+)?function\\s+${NAME}\\s*\\(`, 'gi'))) {
    const start = match.index ?? 0
    const bodyStart = text.indexOf('$$', start)
    const bodyEnd = bodyStart === -1 ? -1 : text.indexOf('$$', bodyStart + 2)
    if (bodyEnd === -1) continue
    const end = text.indexOf(';', bodyEnd)
    out.push({
      index: start,
      event: {
        kind: 'createFunction',
        name: match[1].toLowerCase(),
        attributes: text.slice(start, bodyStart) + text.slice(bodyEnd + 2, end === -1 ? undefined : end),
      },
    })
  }

  return out.sort((a, b) => a.index - b.index)
}

const tables = new Map<string, { rls: boolean }>()
const policies = new Map<string, { table: string; name: string; body: string }>()
const functions = new Map<string, string>()
const views = new Map<string, string>()
const revokedFrom = new Map<string, Set<string>>()
const anonWriteGrants: string[] = []

for (const file of files) {
  for (const { event } of eventsOf(readText(file))) {
    switch (event.kind) {
      case 'createTable':
        tables.set(event.name, { rls: false })
        break
      case 'dropTable':
        tables.delete(event.name)
        for (const [key, policy] of policies) if (policy.table === event.name) policies.delete(key)
        break
      case 'enableRls':
        if (tables.has(event.name)) tables.set(event.name, { rls: true })
        break
      case 'createPolicy':
        policies.set(`${event.table}: ${event.name}`, { table: event.table, name: event.name, body: event.body })
        break
      case 'dropPolicy':
        policies.delete(`${event.table}: ${event.name}`)
        break
      case 'createFunction':
        functions.set(event.name.replace(/^public\./, ''), event.attributes)
        break
      case 'dropFunction':
        functions.delete(event.name.replace(/^public\./, ''))
        break
      case 'createView':
        views.set(event.name, event.definition)
        break
      case 'revoke': {
        const roles = revokedFrom.get(event.name) ?? new Set<string>()
        for (const role of event.roles.split(',')) roles.add(role.trim())
        revokedFrom.set(event.name, roles)
        break
      }
      case 'grant':
        if (/\banon\b/.test(event.roles) && /\b(?:insert|update|delete|truncate|all)\b/.test(event.privileges)) {
          anonWriteGrants.push(`${file}: grant ${event.privileges} on ${event.target} to ${event.roles}`)
        }
        break
    }
  }
}

const AUTH_BOUND = /auth\.uid\(\)|auth\.jwt\(\)|\bis_admin\s*\(|\bhas_role\s*\(|\bis_team_member\s*\(/i

function policyCommand(body: string) {
  return /\bfor\s+(all|select|insert|update|delete)\b/i.exec(body)?.[1]?.toLowerCase() ?? 'all'
}

function policyRoles(body: string) {
  const match = /\bto\s+([\w\s,]+?)(?=\s+(?:using|with\s+check)\b|\s*$)/i.exec(body)
  return match ? match[1].split(',').map((role) => role.trim().toLowerCase()) : ['public']
}

describe('guardrail: Supabase migrations', () => {
  it('replays the migrations', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(tables.size).toBeGreaterThan(10)
  })

  it('every public table has row level security enabled', () => {
    const withoutRls = [...tables].filter(([, table]) => !table.rls).map(([name]) => name)
    expect(withoutRls, 'Add `alter table public.<t> enable row level security;` in the same migration').toEqual([])
  })

  it('no write policy lets callers write without an auth-bound condition', () => {
    const open = [...policies]
      .filter(([, policy]) => {
        const command = policyCommand(policy.body)
        const roles = policyRoles(policy.body)
        const serviceOnly = roles.every((role) => role === 'service_role')
        return command !== 'select' && !serviceOnly && !AUTH_BOUND.test(policy.body)
      })
      .map(([key]) => key)
      .filter((key) => !(key in WRITE_POLICY_EXCEPTIONS))

    expect(open, 'Write through an API route with the service role instead of an open policy').toEqual([])
  })

  it('policy exceptions still exist (remove fixed ones)', () => {
    expect(Object.keys(WRITE_POLICY_EXCEPTIONS).filter((key) => !policies.has(key))).toEqual([])
  })

  it('anon gets no write grants', () => {
    expect(anonWriteGrants).toEqual([])
  })

  it('every SECURITY DEFINER function pins search_path', () => {
    const unpinned = [...functions]
      .filter(([, attributes]) => /security\s+definer/i.test(attributes) && !/set\s+search_path/i.test(attributes))
      .map(([name]) => name)
    expect(unpinned, 'Add `set search_path = public` (or a stricter path)').toEqual([])
  })

  it('every public view is security_invoker or revoked from anon and authenticated', () => {
    const exposed = [...views]
      .filter(([name, definition]) => {
        if (/security_invoker/i.test(definition)) return false
        const roles = revokedFrom.get(name) ?? new Set()
        return !(roles.has('anon') && roles.has('authenticated'))
      })
      .map(([name]) => name)
    expect(exposed, 'Views bypass RLS by default').toEqual([])
  })

  it('migration version prefixes are unique', () => {
    const counts = new Map<string, number>()
    for (const file of files) {
      const version = file.split('/').pop()!.split('_')[0]
      counts.set(version, (counts.get(version) ?? 0) + 1)
    }
    const duplicates = [...counts].filter(([version, count]) => count > 1 && !(version in KNOWN_DUPLICATE_VERSIONS))
    expect(duplicates.map(([version]) => version), 'Use the next free number (e.g. 0013_...)').toEqual([])
  })
})
