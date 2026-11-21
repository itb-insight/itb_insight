import { inflateRawSync } from 'node:zlib'

/*
  Minimal .xlsx reader for importing Google Forms response sheets: unzips the workbook and reads
  the first sheet's cell values as strings. No formulas, styles or dates (a date comes back as the
  serial number Excel stores). Enough for an export, and no dependency for a one-off import.
*/

function readZip(bytes: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Not an .xlsx file (no zip directory found).')

  const entries = new Map<string, Uint8Array>()
  const count = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)

  for (let n = 0; n < count; n += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('Corrupt zip directory.')
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength))

    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const data = bytes.subarray(start, start + compressedSize)

    if (method === 0) entries.set(name, data)
    else if (method === 8) entries.set(name, new Uint8Array(inflateRawSync(data)))
    else throw new Error(`Unsupported zip compression method ${method} for ${name}.`)

    offset += 46 + nameLength + extraLength + commentLength
  }

  return entries
}

function decodeXml(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
    const lower = entity.toLowerCase()
    if (lower === 'amp') return '&'
    if (lower === 'lt') return '<'
    if (lower === 'gt') return '>'
    if (lower === 'quot') return '"'
    if (lower === 'apos') return "'"
    return String.fromCodePoint(lower.startsWith('#x') ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10))
  })
}

/** Concatenated text of every <t> run inside an XML fragment (rich text has several). */
function textRuns(xml: string) {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join('')
}

function attribute(attrs: string, name: string) {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1]
}

function columnIndex(ref: string) {
  let index = 0
  for (const char of /^[A-Z]+/.exec(ref)?.[0] ?? '') index = index * 26 + (char.charCodeAt(0) - 64)
  return index - 1
}

/** Rows of the workbook's first sheet; every cell is a string ('' when empty). */
export function readXlsxRows(bytes: Uint8Array): string[][] {
  const files = readZip(bytes)
  const text = (path: string) => {
    const file = files.get(path)
    return file ? new TextDecoder().decode(file) : null
  }

  const sharedStrings = [...(text('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textRuns(m[1]))

  // First sheet: workbook.xml names it, its relationship file says which part holds it.
  const workbook = text('xl/workbook.xml') ?? ''
  const relId = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(workbook)?.[1]
  const rels = text('xl/_rels/workbook.xml.rels') ?? ''
  const target = relId
    ? new RegExp(`<Relationship\\b[^>]*\\bId="${relId}"[^>]*\\bTarget="([^"]+)"`).exec(rels)?.[1] ??
      new RegExp(`<Relationship\\b[^>]*\\bTarget="([^"]+)"[^>]*\\bId="${relId}"`).exec(rels)?.[1]
    : undefined
  const sheetPath = target ? (target.startsWith('/') ? target.slice(1) : `xl/${target}`) : 'xl/worksheets/sheet1.xml'
  const sheet = text(sheetPath)
  if (!sheet) throw new Error(`Sheet not found in workbook (${sheetPath}).`)

  const rows: string[][] = []
  for (const rowMatch of sheet.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNumber = Number(attribute(rowMatch[1], 'r')) || rows.length + 1
    const row: string[] = []

    for (const cell of (rowMatch[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cell[1]
      const body = cell[2] ?? ''
      const ref = attribute(attrs, 'r')
      const index = ref ? columnIndex(ref) : row.length
      const type = attribute(attrs, 't')
      const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1]

      let value = ''
      if (type === 'inlineStr') value = textRuns(body)
      else if (type === 's' && raw !== undefined) value = sharedStrings[Number(raw)] ?? ''
      else if (raw !== undefined) value = decodeXml(raw)

      while (row.length < index) row.push('')
      row[index] = value
    }

    while (rows.length < rowNumber - 1) rows.push([])
    rows[rowNumber - 1] = row
  }

  return rows
}
