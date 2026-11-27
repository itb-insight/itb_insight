import { createHash } from 'node:crypto'

import { type NextRequest } from 'next/server'

import { adminEmailList } from '@/lib/admin'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { isArcadeDisabled } from '@/lib/arcade-flag'
import { getAuthenticatedUser } from '@/lib/auth'
import { UUID_PATTERN } from '@/lib/input'
import { parseProofLink } from '@/lib/proof-link'
import { optimizeProofImage } from '@/lib/proof-image'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/server'

// Insight Arcade side-quest proof (migrations 0032, 0035). multipart/form-data: quest (arcade-* slug),
// then by the quest's proof_kind:
//   link  -> link (story / post link on Instagram / TikTok / X, checked by src/lib/proof-link.ts)
//   photo -> file (jpeg / png / webp, <= 4 MB; follow quests also send `handle`), re-encoded (src/lib/proof-image.ts: <= 1600 px WebP,
//            metadata stripped) into the private bucket arcade-proofs at <user>/<quest>.webp
// plus handle? and voteTeam? (drone_soccer_teams id). public.arcade_submit_proof decides: points at
// once on the first proof, review first after a void, two attempts.
// 4 MB stays under Vercel's 4.5 MB request body limit; the browser normally sends far less.
const MAX_BYTES = 4 * 1024 * 1024

const MESSAGES: Record<string, [number, string]> = {
  PAUSED: [423, 'Insight Arcade sedang dijeda panitia. Coba lagi nanti.'],
  NOT_OPEN: [403, 'Insight Arcade belum dibuka.'],
  CLOSED: [403, 'Insight Arcade sudah ditutup.'],
  COMMITTEE_ACCOUNT: [403, 'Akun panitia tidak ikut Insight Arcade.'],
  QUEST_NOT_FOUND: [404, 'Quest tidak ditemukan.'],
  ALREADY: [409, 'Quest ini sudah kamu kirim.'],
  NO_MORE_ATTEMPTS: [409, 'Kesempatan kirim ulang untuk quest ini sudah habis.'],
  HANDLE_REQUIRED: [400, 'Isi username akunmu.'],
  HANDLE_INVALID: [400, 'Username hanya boleh huruf, angka, titik, dan garis bawah.'],
  HANDLE_USED: [409, 'Akun ini sudah dipakai untuk quest ini.'],
  PROOF_REQUIRED: [400, 'Kirim bukti sesuai quest ini (link atau foto).'],
  VOTE_REQUIRED: [400, 'Pilih tim yang kamu dukung.'],
}

function imageType(bytes: Uint8Array): { ext: string; mime: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: 'png', mime: 'image/png' }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: 'webp', mime: 'image/webp' }
  }
  return null
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  // NEXT_PUBLIC_ARCADE_DISABLED=true closes /arcade in the proxy; the upload closes with it.
  if (isArcadeDisabled()) return apiError('ARCADE_DISABLED', 'Insight Arcade belum dibuka.', 503)

  const rate = checkRateLimit(request, {
    scope: 'sidequest-submit',
    identity: auth.user.id,
    limit: 6,
    windowMs: 60_000,
    ipLimit: 300,
  })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  const form = await request.formData().catch(() => null)
  if (!form) return apiError('INVALID_INPUT', 'Data tidak valid.', 400)

  const quest = form.get('quest')
  const handle = form.get('handle')
  const voteTeam = form.get('voteTeam')
  if (typeof quest !== 'string' || !/^arcade-[a-z0-9-]{1,72}$/.test(quest)) {
    return apiError('INVALID_INPUT', 'Quest tidak valid.', 400)
  }
  if (handle !== null && (typeof handle !== 'string' || handle.length > 60)) {
    return apiError('INVALID_INPUT', 'Username tidak valid.', 400)
  }
  if (voteTeam !== null && (typeof voteTeam !== 'string' || (voteTeam !== '' && !UUID_PATTERN.test(voteTeam)))) {
    return apiError('INVALID_INPUT', 'Tim tidak valid.', 400)
  }

  const supabase = createServiceClient()
  const findQuest = (columns: string) =>
    supabase.from('sidequests').select(columns).eq('slug', quest).eq('verify', 'proof').eq('is_active', true).maybeSingle()
  let found = await findQuest('proof_kind')
  // Before migration 0035 there is no proof_kind column (42703): every proof quest is a photo quest.
  if (found.error?.code === '42703') found = await findQuest('slug')
  if (found.error) {
    console.error('[arcade-proof] quest lookup failed', found.error)
    return apiError('SERVER_ERROR', 'Gagal memuat quest. Coba lagi.', 500)
  }
  if (!found.data) return apiError('QUEST_NOT_FOUND', MESSAGES.QUEST_NOT_FOUND[1], 404)
  const kind = (found.data as unknown as { proof_kind?: string }).proof_kind ?? 'photo'

  // The proof itself: a link (social quests) or a photo (drone soccer, merch).
  let proof: { p_path: string | null; p_url: string | null; p_sha256: string; p_handle: string | null }
  if (kind === 'link') {
    const raw = form.get('link')
    if (typeof raw !== 'string' || !raw.trim()) return apiError('INVALID_INPUT', 'Tempel link buktinya dulu.', 400)
    const parsed = parseProofLink(raw)
    if (!parsed.ok) return apiError('INVALID_LINK', parsed.message, 400)
    proof = {
      p_path: null,
      p_url: parsed.link.url,
      // Same link from two accounts gets flagged to reviewers (duplicate hash).
      p_sha256: createHash('sha256').update(parsed.link.url.toLowerCase()).digest('hex'),
      p_handle: null,
    }
  } else {
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) return apiError('INVALID_INPUT', 'Pilih foto bukti dulu.', 400)
    if (file.size > MAX_BYTES) return apiError('FILE_TOO_LARGE', 'Foto terlalu besar (maks. 4 MB).', 400)

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!imageType(bytes)) return apiError('INVALID_FILE', 'File harus foto JPG, PNG, atau WebP.', 400)
    const image = await optimizeProofImage(bytes)
    if (!image) return apiError('INVALID_FILE', 'Foto tidak bisa dibaca. Coba foto atau screenshot lain.', 400)

    const path = `${auth.user.id}/${quest}.${image.ext}`
    const { error: uploadError } = await supabase.storage
      .from('arcade-proofs')
      .upload(path, image.bytes, { contentType: image.mime, upsert: true })
    if (uploadError) {
      console.error('[arcade-proof] upload failed', uploadError)
      return apiError('UPLOAD_FAILED', 'Gagal mengunggah foto. Coba lagi.', 500)
    }
    proof = {
      p_path: path,
      p_url: null,
      // Hash of the bytes as received, so the same photo reused by another account matches.
      p_sha256: createHash('sha256').update(bytes).digest('hex'),
      p_handle: typeof handle === 'string' && handle.trim() ? handle : null,
    }
  }

  const { data, error } = await supabase.rpc('arcade_submit_proof', {
    p_user: auth.user.id,
    p_slug: quest,
    p_path: proof.p_path,
    p_sha256: proof.p_sha256,
    p_handle: proof.p_handle,
    // p_url exists from migration 0035; photo proofs leave it out so they also work before it runs.
    ...(proof.p_url ? { p_url: proof.p_url } : {}),
    p_vote_team: typeof voteTeam === 'string' && voteTeam ? voteTeam : null,
    p_admin_emails: adminEmailList(),
  })
  if (error) {
    console.error('[arcade-proof] submit failed', error)
    const paused = error.message?.includes('ARCADE_PAUSED')
    return apiError(paused ? 'PAUSED' : 'SERVER_ERROR', paused ? MESSAGES.PAUSED[1] : 'Gagal menyimpan bukti. Coba lagi.', paused ? 423 : 500)
  }

  const result = (data ?? {}) as { ok?: boolean; code?: string; points?: number }
  if (!result.ok) {
    const [status, message] = MESSAGES[result.code ?? ''] ?? [500, 'Gagal menyimpan bukti.']
    return apiError((result.code ?? 'SERVER_ERROR') as Uppercase<string>, message, status)
  }
  return apiSuccess({ code: result.code, points: result.points ?? 0 }, 201)
}
