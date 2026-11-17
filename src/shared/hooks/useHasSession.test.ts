import { describe, expect, it } from 'vitest'

import { cookieHasSession, sessionCookieKey } from './useHasSession'

const KEY = sessionCookieKey('https://otdy.supabase.co')

describe('useHasSession cookie check', () => {
  it('derives the supabase-js cookie name from the project URL', () => {
    expect(KEY).toBe('sb-otdy-auth-token')
    expect(sessionCookieKey(undefined)).toBeNull()
    expect(sessionCookieKey('not a url')).toBeNull()
  })

  it("sees this project's session cookie, whole or chunked", () => {
    expect(cookieHasSession('a=1; sb-otdy-auth-token=base64-abc', KEY)).toBe(true)
    expect(cookieHasSession('sb-otdy-auth-token.0=base64-abc; sb-otdy-auth-token.1=def', KEY)).toBe(true)
  })

  it('ignores signed-out leftovers: other projects, empty values, the PKCE verifier', () => {
    expect(cookieHasSession('', KEY)).toBe(false)
    expect(cookieHasSession('sb-otherproject-auth-token=base64-abc', KEY)).toBe(false)
    expect(cookieHasSession('sb-otdy-auth-token=', KEY)).toBe(false)
    expect(cookieHasSession('sb-otdy-auth-token-code-verifier=xyz', KEY)).toBe(false)
    expect(cookieHasSession('sb-otdy-auth-token.x=abc', KEY)).toBe(false)
  })

  it('is signed out when Supabase is not configured', () => {
    expect(cookieHasSession('sb-otdy-auth-token=base64-abc', null)).toBe(false)
  })
})
