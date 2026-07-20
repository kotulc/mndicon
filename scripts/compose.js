/**
 * Pure SVG composition for mndicon.
 * Renders resolved template layers into SVG strings painting only with
 * var(--fg)/var(--bg) (the var() fallbacks keep standalone files visible).
 * Every component carries data-role/data-* base attributes so the viewer can
 * retune size, position, and visibility in the DOM without recomposing.
 */
const { GREY } = require('./colors')
const { VIEW } = require('./icons')


const CANVAS = 96   // canvas edge in px; icons scale up from their 16px viewBox
const XMLNS  = 'xmlns="http://www.w3.org/2000/svg"'

// Typeset name -> title font stack (viewer dropdown); geometric is the default
const TYPESETS = {
  sans:      "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif:     "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif",
  humanist:  "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', sans-serif",
  geometric: "Avenir, Montserrat, Corbel, 'URW Gothic', 'Segoe UI', sans-serif",
  mono:      "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
}
const FONT = TYPESETS.geometric


function esc(text) {
  /** Escape XML-significant characters in text content. */
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}


function ink(slot) {
  /** Color fill: CSS variable with a greyscale fallback for standalone files. */
  return `var(--${slot}, ${GREY[slot]})`
}


function place(size, dx) {
  /** Transform centering a 16-unit icon, scaled by size, dx pixels off center. */
  const k = round(size * CANVAS / VIEW)
  const x = round(CANVAS / 2 + dx - size * CANVAS / 2)
  const y = round(CANVAS / 2 - size * CANVAS / 2)
  return `translate(${x} ${y}) scale(${k})`
}


function paint_layer(layer) {
  /** Render one resolved layer: canvas rect, character text, or icon markup. */
  if (layer.role === 'rect') {
    return `<rect data-role="rect" x="0" y="0" width="${CANVAS}" height="${CANVAS}" rx="14" ` +
           `fill="${ink(layer.ink)}"/>`
  }
  if (layer.role === 'char') {
    const size = round(layer.size * CANVAS * (layer.body.length > 1 ? 0.5 : 0.72))
    return `<g data-role="char" data-fs="${size}" data-dx="${layer.dx}" fill="${ink(layer.ink)}">` +
           `<text x="${CANVAS / 2 + layer.dx}" y="${CANVAS / 2}" text-anchor="middle" ` +
           `dominant-baseline="central" font-family="${FONT}" font-weight="700" ` +
           `font-size="${size}">${esc(layer.body)}</text></g>`
  }
  return `<g data-role="${layer.role}" data-size="${layer.size}" data-dx="${layer.dx}" ` +
         `fill="${ink(layer.ink)}" transform="${place(layer.size, layer.dx)}">${layer.body}</g>`
}


function render_layers(layers, uid) {
  /** Resolved layers -> { defs, body }: mask defs plus painted groups, back-to-front.
   *  uid prefixes mask ids so multiple compositions can share one document. */
  const defs = [], parts = []

  layers.forEach((layer, i) => {
    if (layer.cut) {
      if (!parts.length) throw new Error(`compose: 'cut' layer needs a layer below it`)
      const id = `${uid}cut${i}`
      defs.push(`<mask id="${id}"><rect width="${CANVAS}" height="${CANVAS}" fill="#fff"/>` +
                `<g data-role="${layer.role}" data-size="${layer.size}" data-dx="${layer.dx}" ` +
                `fill="#000" transform="${place(layer.size, layer.dx)}">${layer.body}</g></mask>`)
      parts[parts.length - 1] = parts[parts.length - 1].replace(/^<(g|rect) /, `<$1 mask="url(#${id})" `)
    } else {
      parts.push(paint_layer(layer))
    }
  })

  return { defs: defs.join(''), body: parts.join('') }
}


function round(v) {
  /** Trim float noise to two decimals for compact SVG output. */
  return Math.round(v * 100) / 100
}


function compose_icon(layers, uid = '') {
  /** Render resolved layers to a square icon SVG string. */
  const { defs, body } = render_layers(layers, uid)
  return `<svg ${XMLNS} viewBox="0 0 ${CANVAS} ${CANVAS}">${defs}${body}</svg>`
}


function compose_logo(layers, parts, sep, uid = '') {
  /** Render the icon plus the title parts (one styleable tspan each) as a wide logo. */
  const { defs, body } = render_layers(layers, uid)
  const x     = CANVAS + 20
  const width = round(x + parts.join(sep).length * 42 * 0.75 + 8)
  const spans = parts.map((p, i) => `<tspan data-part="${i}">${esc(p)}</tspan>`).join(esc(sep))
  // currentColor: the title sits on the page, so it inherits the page's text color
  const text  = `<text data-role="title" x="${x}" y="${CANVAS / 2}" dominant-baseline="central" ` +
                `font-family="${FONT}" font-weight="600" font-size="42" ` +
                `fill="currentColor">${spans}</text>`
  return `<svg ${XMLNS} viewBox="0 0 ${width} ${CANVAS}">${defs}${body}${text}</svg>`
}


module.exports = { CANVAS, TYPESETS, compose_icon, compose_logo, place }
