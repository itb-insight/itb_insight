#!/usr/bin/env node
/**
 * Pull exact design values for a Figma node out of the REST API.
 *
 *   node scripts/figma-node.mjs "<figma link>" --depth 8
 *   node scripts/figma-node.mjs "<figma link>" --depth 12 --text
 *   node scripts/figma-node.mjs "<figma link>" --grep "Button" > dump.txt
 *
 * Needs FIGMA_TOKEN in the environment or in .env.local (Figma -> Settings ->
 * Security -> Personal access tokens).
 *
 * Flags
 *   --depth N    how many levels to walk (default 6). Raise it when frames come back
 *                empty: an empty frame nearly always means its text sits one level
 *                deeper than the walk reached.
 *   --text       only TEXT nodes. The quickest way to answer "what do these say".
 *   --grep S     only nodes whose name contains S (case-insensitive), plus their
 *                subtree. Good for pulling one component out of a huge frame.
 *   --ids A,B    node ids to fetch instead of the one in the link.
 *   --hidden     include layers hidden in Figma. Off by default: a hidden layer is
 *                still in the file and the API still returns it, so dumping it makes
 *                parts nobody can see look like parts you need to build.
 *   --raw FILE   also write the untouched JSON, for anything this formatter drops.
 */

import fs from "node:fs"
import path from "node:path"

// ---- token -----------------------------------------------------------------

function readToken() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN

  const envPath = path.resolve(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return null

  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((l) => /^\s*FIGMA_TOKEN\s*=/.test(l))

  if (!line) return null
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")
}

// ---- args ------------------------------------------------------------------

function parseArgs(argv) {
  const out = {
    depth: 6,
    textOnly: false,
    grep: null,
    ids: null,
    raw: null,
    target: null,
    hidden: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--depth") out.depth = Number(argv[++i])
    else if (arg === "--text") out.textOnly = true
    else if (arg === "--hidden") out.hidden = true
    else if (arg === "--grep") out.grep = String(argv[++i]).toLowerCase()
    else if (arg === "--ids") out.ids = String(argv[++i])
    else if (arg === "--raw") out.raw = String(argv[++i])
    else if (!arg.startsWith("--")) out.target = arg
  }

  return out
}

function parseTarget(input) {
  if (!input) return {}
  const key = input.match(/figma\.com\/(?:design|file|proto)\/([A-Za-z0-9]+)/)?.[1]
  // Links carry 3255-4933; the API wants 3255:4933
  const id = input.match(/node-id=([0-9]+[-:][0-9]+)/)?.[1]?.replace("-", ":")
  return { key, id }
}

// ---- value formatting ------------------------------------------------------

function round(n, places = 2) {
  const r = Number(n.toFixed(places))
  return Object.is(r, -0) ? 0 : r
}

function hex(c) {
  return (
    "#" +
    [c.r, c.g, c.b]
      .map((v) => Math.round(v * 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  )
}

/** Hex while fully opaque, rgba() once there is transparency. */
function color(c, extraOpacity = 1) {
  const a = (c.a ?? 1) * extraOpacity
  if (a >= 0.999) return hex(c)
  const [r, g, b] = [c.r, c.g, c.b].map((v) => Math.round(v * 255))
  return `rgba(${r}, ${g}, ${b}, ${round(a, 3)})`
}

/**
 * Figma gives two handle points in normalised space. CSS wants an angle where 0deg
 * points up and the sweep runs clockwise; Figma's y axis points down, hence the -dy.
 */
function gradientAngle(paint) {
  const handles = paint.gradientHandlePositions ?? []
  const p0 = handles[0]
  const p1 = handles[1]
  if (!p0 || !p1) return 180

  let deg = (Math.atan2(p1.x - p0.x, -(p1.y - p0.y)) * 180) / Math.PI
  if (deg < 0) deg += 360
  return round(deg, 1)
}

function paintToCss(paint) {
  if (paint.visible === false) return null
  const o = paint.opacity ?? 1

  switch (paint.type) {
    case "SOLID":
      return color(paint.color, o)

    case "GRADIENT_LINEAR":
    case "GRADIENT_RADIAL":
    case "GRADIENT_ANGULAR":
    case "GRADIENT_DIAMOND": {
      const stops = (paint.gradientStops ?? [])
        .map((s) => `${color(s.color, o)} ${round(s.position * 100, 1)}%`)
        .join(", ")

      if (paint.type === "GRADIENT_LINEAR") {
        return `linear-gradient(${gradientAngle(paint)}deg, ${stops})`
      }
      return `radial-gradient(${stops})   /* figma ${paint.type} */`
    }

    case "IMAGE":
      return `image (ref ${paint.imageRef}, ${paint.scaleMode})`

    default:
      // NOISE, PATTERN, and whatever Figma adds next
      return `${paint.type}${o < 1 ? ` (opacity ${round(o, 2)})` : ""}`
  }
}

function radius(node) {
  if (Array.isArray(node.rectangleCornerRadii)) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii.map((r) => round(r))
    return tl === tr && tr === br && br === bl
      ? `${tl}px`
      : `${tl}px ${tr}px ${br}px ${bl}px`
  }
  if (node.cornerRadius) return `${round(node.cornerRadius)}px`
  return null
}

function effectLines(node) {
  const lines = []

  for (const e of node.effects ?? []) {
    if (e.visible === false) continue

    if (e.type === "LAYER_BLUR") {
      lines.push(`filter: blur(${round(e.radius)}px)`)
    } else if (e.type === "BACKGROUND_BLUR") {
      lines.push(`backdrop-filter: blur(${round(e.radius)}px)`)
    } else if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      const inset = e.type === "INNER_SHADOW" ? "inset " : ""
      const spread = e.spread ? ` ${round(e.spread)}px` : ""
      lines.push(
        `box-shadow: ${inset}${round(e.offset?.x ?? 0)}px ${round(e.offset?.y ?? 0)}px ` +
          `${round(e.radius)}px${spread} ${color(e.color)}`,
      )
    } else {
      lines.push(e.type)
    }
  }

  return lines
}

// ---- node formatting -------------------------------------------------------

function describe(node, root, indent) {
  const pad = "  ".repeat(indent)
  const p = `${pad}  `
  const hiddenTag = node.visible === false ? "  [HIDDEN IN FIGMA]" : ""
  const lines = [`${pad}${node.name}  [${node.type}]  ${node.id}${hiddenTag}`]

  const box = node.absoluteBoundingBox
  const rootBox = root.absoluteBoundingBox

  if (box) {
    lines.push(`${p}size ${round(box.width)} x ${round(box.height)}`)

    if (rootBox) {
      const x = box.x - rootBox.x
      const y = box.y - rootBox.y
      lines.push(
        `${p}offset in frame  left ${round(x)}px  top ${round(y)}px` +
          `   (${round((x / rootBox.width) * 100)}% / ${round((y / rootBox.height) * 100)}%)`,
      )
    }

    // The box a blur or stroke actually paints into. An SVG export's canvas matches
    // this, so it hands you the export padding instead of making you infer it.
    const r = node.absoluteRenderBounds
    if (r && (round(r.width) !== round(box.width) || round(r.height) !== round(box.height))) {
      lines.push(
        `${p}render bounds ${round(r.width)} x ${round(r.height)}` +
          `  -> export padding  left ${round(box.x - r.x)}  top ${round(box.y - r.y)}` +
          `  right ${round(r.x + r.width - (box.x + box.width))}` +
          `  bottom ${round(r.y + r.height - (box.y + box.height))}`,
      )
    }
  }

  const t = node.relativeTransform
  if (t) {
    const cssDeg = round((Math.atan2(t[1][0], t[0][0]) * 180) / Math.PI, 2)
    if (cssDeg !== 0) {
      lines.push(
        `${p}rotation  css: transform: rotate(${cssDeg}deg)   (figma shows ${round(-cssDeg, 2)}deg)`,
      )
    }
  }

  if (node.opacity !== undefined && node.opacity < 1) {
    lines.push(`${p}opacity: ${round(node.opacity, 3)}`)
  }

  if (node.blendMode && node.blendMode !== "PASS_THROUGH" && node.blendMode !== "NORMAL") {
    lines.push(`${p}mix-blend-mode: ${node.blendMode.toLowerCase().replace(/_/g, "-")}`)
  }

  for (const paint of node.fills ?? []) {
    const css = paintToCss(paint)
    if (css) lines.push(`${p}fill ${css}`)
  }

  for (const paint of node.strokes ?? []) {
    const css = paintToCss(paint)
    if (!css) continue
    // strokeAlign decides whether the weight eats into the box or sits outside it,
    // which is the difference between matching the mockup and being 4px out.
    lines.push(
      `${p}stroke ${css}  weight ${round(node.strokeWeight ?? 1)}px  align ${node.strokeAlign ?? "?"}`,
    )
  }

  const r = radius(node)
  if (r) lines.push(`${p}border-radius: ${r}`)

  for (const line of effectLines(node)) lines.push(`${p}${line}`)

  if (node.layoutMode && node.layoutMode !== "NONE") {
    lines.push(
      `${p}auto-layout ${node.layoutMode}  gap ${round(node.itemSpacing ?? 0)}` +
        `  padding ${round(node.paddingTop ?? 0)} ${round(node.paddingRight ?? 0)} ` +
        `${round(node.paddingBottom ?? 0)} ${round(node.paddingLeft ?? 0)}`,
    )
  }

  if (node.type === "TEXT") {
    const s = node.style ?? {}
    lines.push(`${p}text ${JSON.stringify(node.characters ?? "")}`)
    lines.push(
      `${p}font ${s.fontFamily ?? "?"} ${s.fontWeight ?? "?"}  ` +
        `${round(s.fontSize ?? 0)}px / ${round(s.lineHeightPx ?? 0)}px` +
        (s.letterSpacing ? `  letter-spacing ${round(s.letterSpacing, 3)}px` : "") +
        `  align ${s.textAlignHorizontal ?? "?"}`,
    )
  }

  return lines.join("\n")
}

function walk(node, root, indent, opts, out) {
  // Figma sets `visible` only when it is false. A hidden layer is not deleted, so the
  // API still returns it in full — dumping it presents furniture nobody can see as
  // something to build. Its children go with it: hiding a parent hides the lot.
  if (node.visible === false && !opts.hidden) return

  const matches =
    (!opts.textOnly || node.type === "TEXT") &&
    (!opts.grep || node.name.toLowerCase().includes(opts.grep))

  if (matches) out.push(describe(node, root, indent))

  // Keep descending past a non-match, or a filter would hide everything nested.
  const nextIndent = matches ? indent + 1 : indent
  for (const child of node.children ?? []) walk(child, root, nextIndent, opts, out)
}

// ---- main ------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const token = readToken()

  if (!token) {
    console.error("No FIGMA_TOKEN found. Put it in .env.local or export it.")
    process.exit(1)
  }

  const { key, id } = parseTarget(opts.target)
  const ids = opts.ids ?? id

  if (!key || !ids) {
    console.error('Usage: node scripts/figma-node.mjs "<figma link with ?node-id=...>" [--depth N]')
    process.exit(1)
  }

  const url =
    `https://api.figma.com/v1/files/${key}/nodes` +
    `?ids=${encodeURIComponent(ids)}&depth=${opts.depth}`

  const res = await fetch(url, { headers: { "X-Figma-Token": token } })

  if (!res.ok) {
    console.error(`Figma API ${res.status} ${res.statusText}\n${await res.text()}`)
    process.exit(1)
  }

  const json = await res.json()

  if (opts.raw) {
    fs.writeFileSync(opts.raw, JSON.stringify(json, null, 2))
    console.error(`raw json -> ${opts.raw}`)
  }

  const out = []

  for (const [nodeId, entry] of Object.entries(json.nodes ?? {})) {
    if (!entry || !entry.document) {
      out.push(`node ${nodeId} came back empty - check the id`)
      continue
    }
    out.push(`${json.name} - node ${nodeId} - depth ${opts.depth}`)
    walk(entry.document, entry.document, 0, opts, out)
  }

  console.log(out.join("\n\n"))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
