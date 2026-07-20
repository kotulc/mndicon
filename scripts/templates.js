/**
 * Declarative composition templates for mndicon.
 * A template is an ordered list of layers drawn back-to-front on the 96x96
 * canvas; every template keeps a solid backing (icon or canvas rect) beneath
 * foreground ink so a single color set reads on light and dark pages alike:
 *   role  icon pool that fills the slot: 'frame' | 'solid' | 'fore', or a
 *         primitive: 'rect' | 'circle' = fill the canvas (no icon pick)
 *   dx    absolute horizontal offset from center in canvas pixels; only the
 *         icons are randomized, never positions; layers stay vertically centered
 *   size  layer scale relative to the canvas (1 = full canvas)
 *   ink   color slot the layer is painted with: 'fg' | 'bg'
 *   cut   true = subtract this layer from the layer below (SVG mask), no ink
 */

const ROLES = ['frame', 'solid', 'fore', 'rect', 'circle']
const PRIMITIVES = ['rect', 'circle']  // canvas shapes drawn directly, no icon pick


const TEMPLATES = {
  overlay: [
    { role: 'solid', dx: 0,  size: 1.0,  ink: 'bg' },
    { role: 'fore',  dx: 0,  size: 0.8, ink: 'fg' },
  ],
  cutout: [
    { role: 'solid', dx: 0, size: 1.0,  ink: 'bg' },
    { role: 'fore',  dx: 0, size: 0.75, cut: true },
  ],
  frame: [
    { role: 'rect',  dx: 0, size: 1.0,  ink: 'bg' },
    { role: 'frame', dx: 0, size: 0.9, ink: 'fg' },
    { role: 'fore',  dx: 0, size: 0.8,  ink: 'fg' },
  ]
}


function resolve_template(name) {
  /** Validate a template name and each layer's fields; return the layer list. */
  if (!(name in TEMPLATES)) {
    throw new Error(`templates: unknown template '${name}' (valid: ${Object.keys(TEMPLATES).join(', ')})`)
  }

  for (const layer of TEMPLATES[name]) {
    if (!ROLES.includes(layer.role)) {
      throw new Error(`templates: ${name}: unknown role '${layer.role}' (valid: ${ROLES.join(', ')})`)
    }
    if (!(typeof layer.dx === 'number' && Math.abs(layer.dx) <= 48)) {
      throw new Error(`templates: ${name}: 'dx' must be an offset in -48..48 pixels`)
    }
    if (!(layer.size > 0 && layer.size <= 1.5)) {
      throw new Error(`templates: ${name}: 'size' must be in (0, 1.5]`)
    }
    if (!layer.cut && !['fg', 'bg'].includes(layer.ink)) {
      throw new Error(`templates: ${name}: 'ink' must be 'fg' or 'bg'`)
    }
  }

  return TEMPLATES[name]
}


module.exports = { PRIMITIVES, ROLES, TEMPLATES, resolve_template }
