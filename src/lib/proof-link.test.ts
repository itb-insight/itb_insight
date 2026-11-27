import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { SOCIAL } from '@/shared/constants/social'

import { parseProofLink } from './proof-link'

function ok(raw: string) {
  const result = parseProofLink(raw)
  if (!result.ok) throw new Error(`expected ok for ${raw}: ${result.message}`)
  return result.link
}

describe('parseProofLink', () => {
  it('accepts Instagram stories, posts and reels, and drops tracking', () => {
    expect(ok('https://www.instagram.com/stories/bimas/3312345678901234567?utm_source=ig_story_item_share')).toEqual({
      url: 'https://www.instagram.com/stories/bimas/3312345678901234567',
      platform: 'instagram',
    })
    expect(ok('https://www.instagram.com/p/Cxyz123/').platform).toBe('instagram')
    expect(ok('instagram.com/reel/Cxyz123').platform).toBe('instagram')
  })

  it('accepts TikTok videos and short links, and X posts', () => {
    expect(ok('https://www.tiktok.com/@bimas/video/7301234567890123456').platform).toBe('tiktok')
    expect(ok('https://vt.tiktok.com/ZSabc123/').platform).toBe('tiktok')
    expect(ok('https://x.com/bimas/status/1861234567890123456').platform).toBe('x')
    expect(ok('https://twitter.com/bimas/status/1861234567890123456').platform).toBe('x')
  })

  it.each([
    '',
    'not a link',
    'https://www.instagram.com/bimas',
    'https://www.tiktok.com/@bimas',
    'https://x.com/bimas',
    'https://evil.example/instagram.com/stories/a/1',
    'https://instagram.com.evil.example/stories/a/1',
    'javascript:alert(1)',
    'ftp://instagram.com/stories/a/1',
    'https://user:pass@instagram.com/stories/a/1',
    `https://www.instagram.com/stories/a/${'1'.repeat(400)}`,
  ])('refuses %s', (raw) => {
    expect(parseProofLink(raw).ok).toBe(false)
  })
})

describe('social accounts agree with the quest catalog', () => {
  const migration = readFileSync('supabase/migrations/0035_arcade_link_proofs.sql', 'utf8')

  it('uses the footer accounts in the quest texts and links', () => {
    expect(migration).toContain(SOCIAL.instagram.url)
    expect(migration).toContain(SOCIAL.tiktok.url)
    expect(migration).toContain(`@${SOCIAL.instagram.handle}`)
    expect(migration).toContain(`TikTok @${SOCIAL.tiktok.handle}`)
    expect(migration).toContain(`X @${SOCIAL.x.handle}`)
    expect(migration).not.toMatch(/@itb\.insight|instagram\.com\/itb\.insight/)
  })

  it('keeps the follow quests as screenshot (photo) proofs', () => {
    expect(migration).toMatch(/'arcade-follow-ig'[\s\S]*?'photo'\)/)
    expect(migration).toMatch(/'arcade-follow-tiktok-x'[\s\S]*?'photo'\)/)
  })
})

describe('0038 proof kinds', () => {
  const sql = readFileSync('supabase/migrations/0038_arcade_proof_kinds.sql', 'utf8')
  const block = (kind: string) =>
    [...sql.matchAll(new RegExp(`proof_kind = '${kind}'[\\s\\S]*?;`, 'g'))].map((m) => m[0]).join('\n')

  it('follow quests are screenshots, merch and drone soccer are photos', () => {
    for (const slug of ['arcade-follow-ig', 'arcade-follow-tiktok-x', 'arcade-beli-merch', 'arcade-nonton-drone-soccer']) {
      expect(block('photo')).toContain(`'${slug}'`)
    }
    expect(sql).toMatch(/unggah screenshot profil @itbinsight/)
  })

  it('share poster, Kyubi and every Add Yours quest take a link', () => {
    const link = block('link')
    for (const slug of ['arcade-share-poster-story', 'arcade-foto-kyubi']) expect(link).toContain(`'${slug}'`)
    expect(link).toContain("slug like 'arcade-add-yours-%'")
  })
})
