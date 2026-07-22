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
  /** Render one resolved layer: icon markup scaled/offset onto the canvas. */
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
      // maskUnits must be pinned to the canvas explicitly: the default (objectBoundingBox,
      // region -10%..110% of the *referencing* layer's own pre-transform path bbox) crops
      // the mask to an icon-dependent, usually off-center window instead of the full canvas
      defs.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CANVAS}" height="${CANVAS}">` +
                `<rect width="${CANVAS}" height="${CANVAS}" fill="#fff"/>` +
                `<g data-role="${layer.role}" data-size="${layer.size}" data-dx="${layer.dx}" ` +
                `fill="#000" transform="${place(layer.size, layer.dx)}">${layer.body}</g></mask>`)
      // The mask attribute must sit on an untransformed wrapper, not the layer's own
      // <g transform="..."> directly: mask content shares the referencing element's
      // user space, which otherwise compounds with that element's own transform and
      // throws the cutout icon's placement far off (e.g. into a corner)
      // data-masked-by is a stable marker distinct from the mask attribute itself:
      // the viewer toggles mask on/off to show/hide the cutout, and needs a
      // never-removed way to re-find this wrapper once mask has been stripped
      parts[parts.length - 1] = `<g mask="url(#${id})" data-masked-by="${id}">${parts[parts.length - 1]}</g>`
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
