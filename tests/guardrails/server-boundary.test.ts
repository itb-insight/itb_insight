import { describe, expect, it } from 'vitest'

import { isClientModule, listFiles, readText } from '../support/repo'

/*
  Keeps secrets and the service-role client on the server.

  - 'use client' modules never import a server module (value import) and never read a
    non-public env var (Next inlines NEXT_PUBLIC_* only; anything else is a bug or a leak)
  - no NEXT_PUBLIC_ variable is named like a secret
  - server modules that touch secrets or the service-role client start with
    `import 'server-only'`, so a client import fails the build instead of shipping
*/

const SECRET_OR_SERVICE =
  /createServiceClient\s*\(|SUPABASE_SERVICE_ROLE_KEY|MIDTRANS_SERVER_KEY|TURNSTILE_SECRET_KEY|MAINTENANCE_BYPASS_SECRET/

/** Server modules not yet marked `import 'server-only'`. Shrink this list; never grow it. */
const MISSING_SERVER_ONLY_BASELINE: string[] = []

const sourceFiles = listFiles('src', /\.(?:ts|tsx)$/).filter((file) => !/\.test\.tsx?$/.test(file))
const sources = new Map(sourceFiles.map((file) => [file, readText(file)]))

/** Server modules = the secret/service-role touching files, addressed by their '@/...' specifier. */
const serverModules = sourceFiles.filter((file) => SECRET_OR_SERVICE.test(sources.get(file)!))
const serverSpecifiers = new Set(serverModules.map((file) => `@/${file.replace(/^src\//, '').replace(/\.tsx?$/, '')}`))

/** Value imports only: `import type ...` and all-`type` specifier lists are erased at build time. */
function valueImports(source: string): string[] {
  const out: string[] = []
  for (const match of source.matchAll(/^import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gm)) {
    if (match[1]) continue
    const clause = match[2]
    const named = /\{([\s\S]*)\}/.exec(clause)
    const hasDefaultOrNamespace = clause.replace(/\{[\s\S]*\}/, '').replace(/,/g, '').trim().length > 0
    const allTypes =
      named !== null &&
      !hasDefaultOrNamespace &&
      named[1]
        .split(',')
        .map((spec) => spec.trim())
        .filter(Boolean)
        .every((spec) => spec.startsWith('type '))
    if (!allTypes) out.push(match[3])
  }
  for (const match of source.matchAll(/^import\s+['"]([^'"]+)['"]/gm)) out.push(match[1])
  return out
}

const isServerEntry = (file: string) => /\/(?:route|page|layout|template|default|not-found|error)\.tsx?$/.test(file) || file === 'src/proxy.ts'
const hasServerOnly = (source: string) => /^import\s+['"]server-only['"]/m.test(source)

describe('guardrail: server/client boundary', () => {
  it('finds the server modules', () => {
    expect(serverModules).toContain('src/lib/supabase/server.ts')
  })

  it("'use client' modules do not import server modules", () => {
    const offenders: string[] = []
    for (const [file, source] of sources) {
      if (!isClientModule(source)) continue
      for (const specifier of valueImports(source)) {
        if (serverSpecifiers.has(specifier) || specifier === 'next/headers') offenders.push(`${file} -> ${specifier}`)
      }
    }
    expect(offenders, 'Call an API route or pass data from a server component instead').toEqual([])
  })

  it("'use client' modules only read NEXT_PUBLIC_* env vars", () => {
    const offenders: string[] = []
    for (const [file, source] of sources) {
      if (!isClientModule(source)) continue
      for (const match of source.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
        if (!match[1].startsWith('NEXT_PUBLIC_') && match[1] !== 'NODE_ENV') offenders.push(`${file}: ${match[1]}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('no NEXT_PUBLIC_ variable is named like a secret', () => {
    const files = [...sources.keys(), '.env.example']
    const offenders = files.flatMap((file) =>
      [...readText(file).matchAll(/NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|SERVER_KEY|PRIVATE|PASSWORD)[A-Z0-9_]*/g)].map(
        (match) => `${file}: ${match[0]}`,
      ),
    )
    expect(offenders, 'NEXT_PUBLIC_ values are inlined into the browser bundle').toEqual([])
  })

  it("server modules that touch secrets import 'server-only' (ratchet)", () => {
    const missing = serverModules.filter((file) => !isServerEntry(file) && !hasServerOnly(sources.get(file)!))
    const unexpected = missing.filter((file) => !MISSING_SERVER_ONLY_BASELINE.includes(file))
    expect(unexpected, "Add `import 'server-only'` as the first import").toEqual([])
  })

  it('the server-only baseline only lists files that still need it', () => {
    const stillMissing = new Set(serverModules.filter((file) => !hasServerOnly(sources.get(file)!)))
    const stale = MISSING_SERVER_ONLY_BASELINE.filter((file) => !stillMissing.has(file))
    expect(stale, 'Fixed: remove these from MISSING_SERVER_ONLY_BASELINE').toEqual([])
  })
})
