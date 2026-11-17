import { describe, expect, it } from 'vitest'

import { fileSize, readText, trackedFiles } from '../support/repo'

/*
  The repository is public. Nothing tracked by git may contain a credential, and local-only
  files (.env*, Supabase CLI state) must not be tracked. GitHub secret scanning with push
  protection is the second line of defence; enable it in the repo settings.
*/

const SECRET_PATTERNS: Array<[string, RegExp]> = [
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{16,}/],
  ['JWT (e.g. a legacy Supabase service_role key)', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['Google OAuth client secret', /\bGOCSPX-[A-Za-z0-9_-]{16,}/],
  ['Midtrans server key', /\b(?:SB-)?Mid-server-[A-Za-z0-9_-]{16,}/],
  ['Private key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
  ['Postgres URL with a password', /\bpostgres(?:ql)?:\/\/[^:/\s"'@]+:[^@\s"'/]+@/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
]

const BINARY = /\.(?:png|jpe?g|gif|webp|avif|ico|svg|mp4|webm|mov|glb|gltf|woff2?|ttf|otf|pdf|zip|lottie)$/i
const SKIP = new Set(['package-lock.json'])

/** Tracked paths that must stay local. */
const FORBIDDEN_TRACKED: Array<[string, RegExp]> = [
  ['.env file (only .env.example may be committed)', /(?:^|\/)\.env(?!\.example$)[^/]*$/],
  ['Vercel project link', /(?:^|\/)\.vercel\//],
  ['Supabase CLI state', /^supabase\/\.temp\//],
  ['Personal notes (keep outside the public repo)', /^notes\.md$/],
  ['Private key file', /\.(?:pem|key|p12|pfx)$/i],
]


const tracked = trackedFiles()

describe('guardrail: secrets', () => {
  it('no tracked text file contains a credential', () => {
    const findings: string[] = []
    for (const file of tracked) {
      if (BINARY.test(file) || SKIP.has(file) || fileSize(file) > 2 * 1024 * 1024) continue
      const text = readText(file)
      for (const [label, pattern] of SECRET_PATTERNS) {
        if (pattern.test(text)) findings.push(`${file}: ${label}`)
      }
    }
    expect(findings, 'Remove it, rotate the credential, and keep it in Vercel env vars / .env.local').toEqual([])
  })

  it('local-only files are not tracked', () => {
    const offenders = tracked.flatMap((file) =>
      FORBIDDEN_TRACKED.filter(([, pattern]) => pattern.test(file)).map(([label]) => `${file}: ${label}`),
    )
    expect(offenders, 'git rm --cached <file> and add it to .gitignore').toEqual([])
  })

  it('.gitignore keeps env files out', () => {
    expect(readText('.gitignore')).toMatch(/^\.env\*$/m)
  })
})
