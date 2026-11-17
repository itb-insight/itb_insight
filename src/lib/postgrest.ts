// Helpers for building PostgREST filters from user input. Never interpolate raw input into
// .or()/.filter() strings: `,` `(` `)` add conditions, and `%` `_` `*` are wildcards in ilike
// (PostgREST also reads `*` as `%`). tests/guardrails/postgrest-filters.test.ts enforces this.

/** Escapes LIKE wildcards and the escape character, so the text matches literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

/** Removes characters that PostgREST treats as syntax in an unquoted filter value. */
export function stripFilterSyntax(value: string): string {
  return value.replace(/[,()"*]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * An `.or()` filter matching `term` case-insensitively as a substring of any of `columns`.
 * `columns` must be code constants, never user input.
 */
export function ilikeAnyFilter(columns: readonly string[], term: string): string {
  const safe = escapeLike(stripFilterSyntax(term))
  return columns.map((column) => `${column}.ilike.%${safe}%`).join(',')
}
