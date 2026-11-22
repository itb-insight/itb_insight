import { deflateRawSync } from 'node:zlib'

import { describe, expect, it } from 'vitest'

import {
  matchFeeTier,
  normalizeNisn,
  normalizePhone,
  parseOeSheet,
  serialToIso,
  type FeeTier,
} from './oe-form'
import { readXlsxRows } from './xlsx'

const TIERS: FeeTier[] = [
  { key: 'early', label: 'Early Bird Registration', amount: 150000 },
  { key: 'normal', label: 'Normal Registration', amount: 160000 },
  { key: 'late', label: 'Late Registration', amount: 175000 },
]

const HEADER = [
  'Timestamp',
  'Email Address',
  'Nama Tim',
  'Sekolah Asal',
  'Nama Lengkap Ketua Tim',
  'NISN Ketua Tim',
  'Foto Kartu Pelajar Ketua Tim',
  'Email Aktif Ketua Tim',
  'Nomor WhatsApp Aktif Ketua Tim',
  'Nama Lengkap Anggota 1',
  'NISN Anggota 1',
  'Foto Kartu Pelajar Anggota 1',
  'Nama Lengkap Anggota 2',
  'NISN Anggota 2',
  'Foto Kartu Pelajar Anggota 2',
  'Bukti Unggah Twibbon\nScreenshot postingan Twibbon …',
  'Bukti Follow Instagram\nScreenshot …',
  'Bukti Share Informasi Kompetisi \nScreenshot …',
  'Bukti Post Story Instagram Poster \nScreenshot …',
  'Pakta Integritas\nDokumen …',
  'Gelombang pendaftaran',
  'Bukti Pembayaran',
]

const row = (overrides: Partial<Record<number, string>> = {}) => {
  const cells = [
    '46263.5',
    'ketua@example.com',
    'Tim Elang',
    'SMA Negeri 1 Contoh',
    'Andi  Pratama',
    '0081234567',
    'https://drive.google.com/open?id=card1',
    ' Ketua@Example.com ',
    '81234567890',
    'Budi Santoso',
    '8.1234567E7',
    'https://drive.google.com/open?id=card2',
    'Citra Dewi',
    '0091234567',
    'https://drive.google.com/open?id=card3',
    'https://drive.google.com/open?id=twb',
    'https://drive.google.com/open?id=fol',
    'https://drive.google.com/open?id=shr',
    'https://drive.google.com/open?id=sty',
    'https://drive.google.com/open?id=pkt',
    'Late Registration : Rp175.000 / tim : periode 1 Oktober – 20 Oktober 2026',
    'https://drive.google.com/open?id=pay',
  ]
  for (const [index, value] of Object.entries(overrides)) cells[Number(index)] = value ?? ''
  return cells
}

describe('normalizeNisn', () => {
  it('keeps a 10-digit text NISN, including its leading zeros', () => {
    expect(normalizeNisn('0081234567')).toEqual({ value: '0081234567', issues: [] })
  })

  it('restores leading zeros Sheets dropped from a number, even in scientific notation', () => {
    expect(normalizeNisn('8.1234567E7').value).toBe('0081234567')
    expect(normalizeNisn('8.1234567E7').issues[0].code).toBe('NISN_PADDED')
  })

  it('strips invisible characters and labels', () => {
    expect(normalizeNisn('‭0081234567‬').value).toBe('0081234567')
    expect(normalizeNisn('NISN : 0081234567').value).toBe('0081234567')
  })

  it('flags what cannot be a NISN without guessing', () => {
    expect(normalizeNisn('-')).toMatchObject({ value: null, issues: [{ code: 'NISN_FORMAT' }] })
    expect(normalizeNisn('12345').issues[0].code).toBe('NISN_FORMAT')
    // Typed as text: never padded, the digits might be wrong rather than truncated.
    expect(normalizeNisn('123456789')).toMatchObject({ value: '123456789', issues: [{ code: 'NISN_FORMAT' }] })
  })
})

describe('normalizePhone', () => {
  it('writes Indonesian mobiles as 08…', () => {
    expect(normalizePhone('081234567890').value).toBe('081234567890')
    expect(normalizePhone('+62 812-3456-7890').value).toBe('081234567890')
    expect(normalizePhone('81234567890').value).toBe('081234567890')
    expect(normalizePhone('8.1234567890E10').value).toBe('081234567890')
  })

  it('flags numbers that are not mobiles', () => {
    expect(normalizePhone('12345').issues[0].code).toBe('PHONE_FORMAT')
    expect(normalizePhone('')).toMatchObject({ value: null })
  })
})

describe('serialToIso', () => {
  it('reads a Sheets serial as Jakarta time', () => {
    // 46263.5 = 2026-08-29 12:00 WIB = 05:00 UTC (serial 0 = 1899-12-30)
    expect(serialToIso('46263.5')).toBe('2026-08-29T05:00:00.000Z')
  })

  it('rejects values that are not a plausible serial', () => {
    expect(serialToIso('hello')).toBeNull()
    expect(serialToIso('12')).toBeNull()
  })
})

describe('matchFeeTier', () => {
  it('matches the tier label regardless of spacing', () => {
    expect(matchFeeTier('Normal Registration     : Rp160.000 / tim', TIERS).tier?.key).toBe('normal')
  })

  it('refuses a tier whose stated amount disagrees with the catalog', () => {
    expect(matchFeeTier('Late Registration : Rp180.000 / tim', TIERS)).toMatchObject({
      tier: null,
      issues: [{ code: 'FEE_AMOUNT_MISMATCH' }],
    })
  })

  it('refuses an unknown tier', () => {
    expect(matchFeeTier('Super Early : Rp100.000', TIERS).issues[0].code).toBe('UNKNOWN_FEE_TIER')
  })
})

describe('parseOeSheet', () => {
  it('turns a form row into a team of three with the leader claimable by email', () => {
    const { rows, emptyRows } = parseOeSheet([HEADER, row(), [], ['', '  ']], TIERS)

    expect(emptyRows).toBe(2)
    expect(rows).toHaveLength(1)
    const record = rows[0].record!
    expect(record).toMatchObject({
      row: 2,
      teamName: 'Tim Elang',
      school: 'SMA Negeri 1 Contoh',
      leaderEmail: 'ketua@example.com',
      leaderPhone: '081234567890',
      submittedAt: '2026-08-29T05:00:00.000Z',
      feeTier: { key: 'late', amount: 175000 },
      documents: { payment_proof: 'https://drive.google.com/open?id=pay' },
    })
    expect(record.members.map((m) => [m.slot, m.role, m.name, m.nisn])).toEqual([
      [1, 'leader', 'Andi Pratama', '0081234567'],
      [2, 'member', 'Budi Santoso', '0081234567'],
      [3, 'member', 'Citra Dewi', '0091234567'],
    ])
    expect(record.sourceKey).toMatch(/^[0-9a-f]{64}$/)
  })

  it('rejects a row missing a required answer, and says which', () => {
    const { rows } = parseOeSheet([HEADER, row({ 12: '' })], TIERS)
    expect(rows[0].record).toBeNull()
    expect(rows[0].issues).toContainEqual({ level: 'error', code: 'MISSING_FIELD', field: 'member2Name' })
  })

  it('rejects an invalid leader email', () => {
    const { rows } = parseOeSheet([HEADER, row({ 7: 'not-an-email' })], TIERS)
    expect(rows[0].issues).toContainEqual({ level: 'error', code: 'INVALID_EMAIL', field: 'leaderEmail' })
  })

  it('imports duplicate team names (different schools) but warns', () => {
    const { rows } = parseOeSheet(
      [HEADER, row(), row({ 0: '46264.1', 7: 'other@example.com', 3: 'SMA Lain' })],
      TIERS,
    )
    expect(rows.every((r) => r.record)).toBe(true)
    expect(rows[0].issues.map((i) => i.code)).toContain('TEAM_NAME_DUPLICATE')
  })

  it('warns on a NISN that appears in two teams', () => {
    const { rows } = parseOeSheet([HEADER, row(), row({ 0: '46264.1', 7: 'other@example.com' })], TIERS)
    expect(rows[1].issues.map((i) => i.code)).toContain('NISN_DUPLICATE')
  })

  it('rejects the second copy of the same submission', () => {
    const { rows } = parseOeSheet([HEADER, row(), row()], TIERS)
    expect(rows[0].record).not.toBeNull()
    expect(rows[1]).toMatchObject({ record: null, issues: expect.arrayContaining([expect.objectContaining({ code: 'DUPLICATE_SUBMISSION' })]) })
  })

  it('notes when someone other than the leader submitted the form', () => {
    const { rows } = parseOeSheet([HEADER, row({ 1: 'guru@example.com' })], TIERS)
    expect(rows[0].record).not.toBeNull()
    expect(rows[0].issues.map((i) => i.code)).toContain('SUBMITTER_DIFFERS')
  })

  it('fails loudly when the form columns changed', () => {
    expect(() => parseOeSheet([HEADER.filter((h) => h !== 'Sekolah Asal'), row()], TIERS)).toThrow(/Sekolah Asal/)
  })
})

// ── readXlsxRows on a real (tiny) workbook ──────────────────────────────────────────────────

function zip(files: Record<string, string>, deflate: boolean) {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name)
    const raw = encoder.encode(content)
    const data = deflate ? new Uint8Array(deflateRawSync(raw)) : raw
    const method = deflate ? 8 : 0

    const local = new Uint8Array(30 + nameBytes.length + data.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(8, method, true)
    lv.setUint32(18, data.length, true)
    lv.setUint32(22, raw.length, true)
    lv.setUint16(26, nameBytes.length, true)
    local.set(nameBytes, 30)
    local.set(data, 30 + nameBytes.length)

    const central = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(10, method, true)
    cv.setUint32(20, data.length, true)
    cv.setUint32(24, raw.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint32(42, offset, true)
    central.set(nameBytes, 46)

    locals.push(local)
    centrals.push(central)
    offset += local.length
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, centrals.length, true)
  ev.setUint16(10, centrals.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)

  const out = new Uint8Array(offset + centralSize + 22)
  let at = 0
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at)
    at += part.length
  }
  return out
}

const WORKBOOK = {
  'xl/workbook.xml':
    '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Form Responses 1" sheetId="1" r:id="rId3"/></sheets></workbook>',
  'xl/_rels/workbook.xml.rels':
    '<Relationships><Relationship Id="rId3" Type="worksheet" Target="worksheets/sheet7.xml"/></Relationships>',
  'xl/sharedStrings.xml':
    '<sst><si><t>Nama Tim</t></si><si><r><t>Tim </t></r><r><t xml:space="preserve">A &amp; B</t></r></si></sst>',
  'xl/worksheets/sheet7.xml':
    '<worksheet><sheetData>' +
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Inline</t></is></c></row>' +
    '<row r="3"><c r="A3" t="s"><v>1</v></c><c r="B3" s="2"/><c r="C3"><v>8.1234567E7</v></c></row>' +
    '</sheetData></worksheet>',
}

describe('readXlsxRows', () => {
  it.each([true, false])('reads shared, rich, inline and numeric cells (deflate=%s)', (deflate) => {
    expect(readXlsxRows(zip(WORKBOOK, deflate))).toEqual([
      ['Nama Tim', '', 'Inline'],
      [],
      ['Tim A & B', '', '8.1234567E7'],
    ])
  })

  it('rejects a file that is not a zip', () => {
    expect(() => readXlsxRows(new TextEncoder().encode('not a workbook'))).toThrow(/zip/)
  })
})
