/**
 * Color schemes for mndicon.
 * Every scheme pairs a saturated mid-tone background with a near-white tinted
 * foreground so one generated set stays legible on light and dark pages alike;
 * scheme names and primary hues reuse mdsite's Tailwind-600 color presets.
 */

// Greyscale default; its fg/bg lightness bands match the colored schemes
const GREY = { fg: '#fafafa', bg: '#52525b' }

// Scheme name -> [background hue, foreground tint hue] (tint = background + 180)
const SCHEMES = {
  blue:    [221, 41],
  indigo:  [243, 63],
  violet:  [262, 82],
  rose:    [347, 167],
  orange:  [21, 201],
  amber:   [38, 218],
  emerald: [161, 341],
  teal:    [175, 355],
  cyan:    [192, 12],
}


function bake_colors(svg, colors) {
  /** Replace every var(--fg/--bg) reference with concrete colors for saved assets. */
  return svg.replace(/var\(--fg[^)]*\)/g, colors.fg).replace(/var\(--bg[^)]*\)/g, colors.bg)
}


function resolve_scheme(name) {
  /** Concrete { fg, bg } colors for a scheme; 'grey' returns the greyscale pair. */
  if (name === 'grey') return GREY
  if (!(name in SCHEMES)) {
    throw new Error(`colors: unknown scheme '${name}' (valid: grey, ${Object.keys(SCHEMES).join(', ')})`)
  }

  const [primary, tint] = SCHEMES[name]
  return { fg: `hsl(${tint} 80% 93%)`, bg: `hsl(${primary} 65% 45%)` }
}


module.exports = { GREY, SCHEMES, bake_colors, resolve_scheme }
