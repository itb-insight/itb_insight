import { createHash } from 'node:crypto'

import { type NextRequest } from 'next/server'

import { adminEmailList } from '@/lib/admin'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { isArcadeDisabled } from '@/lib/arcade-flag'
import { getAuthenticatedUser } from '@/lib/auth'
import { UUID_PATTERN } from '@/lib/input'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/server'

// Insight Arcade photo proof (migration 0032). multipart/form-data: quest (arcade-* slug), file
// (jpeg / png / webp, <= 2 MB), handle? (IG / TikTok username), voteTeam? (competition_teams id).
// The image goes to the private bucket arcade-proofs at <user>/<quest>; public.arcade_submit_proof
// decides: points at once on the first upload, review first after a void, two attempts.
const MAX_BYTES = 2 * 1024 * 1024

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
  HANDLE_USED: [409, 'Username ini sudah dipakai untuk quest ini.'],
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
  const file = form.get('file')
  const handle = form.get('handle')
  const voteTeam = form.get('voteTeam')
  if (typeof quest !== 'string' || !/^arcade-[a-z0-9-]{1,72}$/.test(quest)) {
    return apiError('INVALID_INPUT', 'Quest tidak valid.', 400)
  }
  if (!(file instanceof File) || file.size === 0) return apiError('INVALID_INPUT', 'Pilih foto bukti dulu.', 400)
  if (file.size > MAX_BYTES) return apiError('FILE_TOO_LARGE', 'Foto terlalu besar (maks. 2 MB).', 400)
  if (handle !== null && (typeof handle !== 'string' || handle.length > 60)) {
    return apiError('INVALID_INPUT', 'Username tidak valid.', 400)
  }
  if (voteTeam !== null && (typeof voteTeam !== 'string' || (voteTeam !== '' && !UUID_PATTERN.test(voteTeam)))) {
    return apiError('INVALID_INPUT', 'Tim tidak valid.', 400)
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = imageType(bytes)
  if (!type) return apiError('INVALID_FILE', 'File harus foto JPG, PNG, atau WebP.', 400)

  const supabase = createServiceClient()
  const path = `${auth.user.id}/${quest}.${type.ext}`
  const { error: uploadError } = await supabase.storage
    .from('arcade-proofs')
    .upload(path, bytes, { contentType: type.mime, upsert: true })
  if (uploadError) {
    console.error('[arcade-proof] upload failed', uploadError)
    return apiError('UPLOAD_FAILED', 'Gagal mengunggah foto. Coba lagi.', 500)
  }

  const { data, error } = await supabase.rpc('arcade_submit_proof', {
    p_user: auth.user.id,
    p_slug: quest,
    p_path: path,
    p_sha256: createHash('sha256').update(bytes).digest('hex'),
    p_handle: typeof handle === 'string' && handle.trim() ? handle : null,
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
