#!/usr/bin/env node
// Fails when a production dependency has a high/critical advisory that is not approved in
// audit-allowlist.json, or whose approval has expired. Moderate/low advisories are printed only.
//
//   node scripts/audit-prod.mjs        (npm run audit:prod)
//
// Allowlist entries: { "GHSA-xxxx": { "package", "reason", "expires": "YYYY-MM-DD" } }.
// Keep expiries short so every exception gets looked at again.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const FAIL_AT = new Set(['high', 'critical'])
const allowlist = JSON.parse(readFileSync(new URL('../audit-allowlist.json', import.meta.url), 'utf8'))

let raw
try {
  raw = execFileSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
} catch (err) {
  raw = err.stdout // npm audit exits non-zero whenever it finds something
}

const report = JSON.parse(raw || '{}')
if (report.error) {
  console.error('npm audit failed:', report.error.summary ?? report.error)
  process.exit(2)
}

const today = new Date().toISOString().slice(0, 10)
const advisories = new Map()
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via ?? []) {
    if (typeof via === 'object' && via.url) {
      advisories.set(via.url.split('/').pop(), { pkg: via.name ?? vuln.name, severity: via.severity, title: via.title })
    }
  }
}

const failures = []
for (const [id, adv] of advisories) {
  const entry = allowlist[id]
  const approved = Boolean(entry) && entry.expires >= today
  const blocking = FAIL_AT.has(adv.severity) && !approved
  console.log(`${approved ? 'approved' : blocking ? 'FAIL    ' : 'warn    '} ${adv.severity.padEnd(9)}${adv.pkg}  ${id}  ${adv.title}`)
  if (entry && !approved) console.log(`         approval expired on ${entry.expires}`)
  if (blocking) failures.push(id)
}

for (const id of Object.keys(allowlist)) {
  if (!advisories.has(id)) console.log(`note: ${id} is no longer reported; remove it from audit-allowlist.json`)
}

if (failures.length) {
  console.error(
    `\n${failures.length} unapproved high/critical advisor${failures.length === 1 ? 'y' : 'ies'} in production dependencies.` +
      '\nUpgrade the package, or add a dated entry with a reason to audit-allowlist.json.',
  )
  process.exit(1)
}
console.log('\nNo unapproved high/critical advisories in production dependencies.')
