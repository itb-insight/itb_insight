import { describe, expect, it } from 'vitest'

import { listFiles, readText } from '../support/repo'

/*
  PostgREST filter strings (.or(), .filter(), .not(), .textSearch(), .match() with a string)
  are a mini query language: `,` `(` `)` `.` in user input add or change conditions, and `%` `_`
  are wildcards in ilike. Never build them with template literals; use .eq()/.ilike() with an
  escaped value instead.
*/

/** file -> number of known interpolated filters. Shrink this; never grow it. */
const BASELINE: Record<string, number> = {}

const INTERPOLATED_FILTER = /\.(?:or|filter|not|textSearch|match)\(\s*`(?:[^`\\]|\\[\s\S])*?\$\{/g

const counts = new Map(
  listFiles('src', /\.(?:ts|tsx)$/)
    .filter((file) => !/\.test\.tsx?$/.test(file))
    .map((file) => [file, [...readText(file).matchAll(INTERPOLATED_FILTER)].length] as const)
    .filter(([, count]) => count > 0),
)

describe('guardrail: PostgREST filter injection', () => {
  it('no new template-literal filters', () => {
    const grown = [...counts].filter(([file, count]) => count > (BASELINE[file] ?? 0)).map(([file, count]) => `${file} (${count})`)
    expect(grown, 'Use .eq()/.ilike() with an escaped value instead of interpolating into a filter string').toEqual([])
  })

  it('the baseline only lists files that still need it', () => {
    const stale = Object.entries(BASELINE)
      .filter(([file, count]) => (counts.get(file) ?? 0) < count)
      .map(([file]) => file)
    expect(stale, 'Fixed: lower or remove these BASELINE entries').toEqual([])
  })
})
