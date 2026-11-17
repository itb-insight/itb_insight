import { describe, expect, it } from 'vitest'

import { listFiles, readText } from '../support/repo'

/*
  Preview, test and dev pages ship to production like any other route. New ones must either
  not exist under src/app, or return notFound() in production:

    if (process.env.NODE_ENV === 'production') notFound()
*/

const PREVIEW_SEGMENT = /^(?:test-.*|.*[-_]dev|.*hi-?fi.*|.*lo-?fi.*|.*preview.*|.*sandbox.*)$/i

/** Existing preview routes. Shrink this list; never grow it. */
const BASELINE: string[] = []

const GATED = /NODE_ENV\s*===\s*['"]production['"][\s\S]{0,200}?notFound\(\)/

const previewRoutes = listFiles('src/app', /^(?:page|route)\.(?:ts|tsx)$/).filter((file) =>
  file
    .split('/')
    .slice(2, -1)
    .some((segment) => PREVIEW_SEGMENT.test(segment)),
)

describe('guardrail: preview/dev routes', () => {
  it('no new ungated preview routes', () => {
    const offenders = previewRoutes.filter((file) => !BASELINE.includes(file) && !GATED.test(readText(file)))
    expect(offenders, "Gate it: `if (process.env.NODE_ENV === 'production') notFound()`").toEqual([])
  })

  it('the baseline only lists routes that still exist ungated', () => {
    const stale = BASELINE.filter((file) => !previewRoutes.includes(file) || GATED.test(readText(file)))
    expect(stale, 'Removed or gated: delete these from BASELINE').toEqual([])
  })
})
