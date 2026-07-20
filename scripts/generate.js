/**
 * Seeded candidate generation for mndicon.
 * Produces one candidate per composition template; a mulberry32 stream drives
 * the only random picks (the icons) in a fixed order, so a single integer seed
 * reproduces a full candidate set (compatible with mdsite's logo_seed).
 */
const { ICON_ROLES, load_icon } = require('./icons')
const { compose_icon, compose_logo } = require('./compose')
const { TEMPLATES, resolve_template } = require('./templates')


function create_rng(seed) {
  /** mulberry32: tiny deterministic PRNG returning floats in [0, 1). */
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}


function generate_candidates(config) {
  /** Build one seeded candidate record per composition template. */
  const seed = config.seed ?? Date.now() % 1e9
  const rng  = create_rng(seed)
  const { parts, sep } = title_parts(config)

  const candidates = Object.keys(TEMPLATES).map((template, index) => {
    const icons = {}
    const layers = resolve_template(template).map(layer => {
      const name = pick(rng, ICON_ROLES[layer.role])
      icons[layer.role] = name
      return { ...layer, body: load_icon(name).body }
    })

    return {
      index, seed, template, icons,
      svg_icon: compose_icon(layers, `c${index}-`),
      svg_logo: compose_logo(layers, parts, sep, `c${index}-`),
    }
  })

  return { seed, candidates }
}


function pick(rng, list) {
  /** Seeded uniform choice from a list. */
  return list[Math.floor(rng() * list.length)]
}


function title_parts(config) {
  /** Normalized title parts and separator (config may bypass load_config in tests). */
  if (config.title_parts) return { parts: config.title_parts, sep: config.sep ?? '' }
  return { parts: String(config.title).trim().split(/\s+/), sep: ' ' }
}


module.exports = { create_rng, generate_candidates, pick, title_parts }
