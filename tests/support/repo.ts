// File-system helpers for the guardrail tests (tests/guardrails). Paths are repo-relative and
// use forward slashes, so allowlists read the same on every OS.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../..', import.meta.url))

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.vercel', 'coverage'])

export function rel(absPath: string): string {
  return relative(ROOT, absPath).split(sep).join('/')
}

export function abs(relPath: string): string {
  return join(ROOT, relPath)
}

export function exists(relPath: string): boolean {
  return existsSync(abs(relPath))
}

export function readText(relPath: string): string {
  return readFileSync(abs(relPath), 'utf8')
}

export function fileSize(relPath: string): number {
  return statSync(abs(relPath)).size
}

/** Repo-relative paths of the files under `dir` whose name matches `pattern`, sorted. */
export function listFiles(dir: string, pattern: RegExp): string[] {
  const out: string[] = []
  const walk = (absDir: string) => {
    for (const entry of readdirSync(absDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(absDir, entry.name))
      } else if (pattern.test(entry.name)) {
        out.push(rel(join(absDir, entry.name)))
      }
    }
  }
  walk(abs(dir))
  return out.sort()
}

/**
 * Files git tracks or would add (untracked but not ignored): what the next commit, CI and Vercel
 * see. Skips tracked files deleted locally.
 */
export function trackedFiles(prefix = '.'): string[] {
  const output = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', prefix], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return output
    .split('\0')
    .filter((file) => file && exists(file))
    .sort()
}

/** True when a .ts/.tsx module starts with the 'use client' directive. */
export function isClientModule(source: string): boolean {
  return /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/.test(source)
}
