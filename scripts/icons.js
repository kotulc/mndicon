/**
 * Bootstrap icon registry and loader for mndicon.
 * Curates icon names by composition role and loads an icon's inner markup from
 * the bootstrap-icons package, normalized to the shared 16x16 viewBox.
 */
const fs   = require('fs')
const path = require('path')


const ICON_DIR = path.join(path.dirname(require.resolve('bootstrap-icons/package.json')), 'icons')
const VIEW     = 16  // every bootstrap icon ships as viewBox="0 0 16 16"

// Composition role -> curated icon names appropriate for that slot
const ICON_ROLES = {
  frame: ['app', 'shield', 'chat-square', 'square', 'file', 'hexagon', 'octagon', 'triangle'],
  solid: ['square-fill', 'shield-fill', 'chat-fill', 'file-fill', 'hexagon-fill',
          'octagon-fill', 'triangle-fill'],
  fore:  ['caret-down-fill', 'caret-left-fill', 'caret-right-fill', 'caret-up-fill',
          'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'activity', 'box', 'boxes',
          'braces', 'chevron-bar-expand', 'chevron-expand', 'crop', 'diamond-half'],
}


function check_registry() {
  /** Verify every registered icon name maps to a bootstrap-icons file; throw listing gaps. */
  const names   = Object.values(ICON_ROLES).flat()
  const missing = names.filter(n => !fs.existsSync(path.join(ICON_DIR, `${n}.svg`)))
  if (missing.length) throw new Error(`icons: missing from bootstrap-icons: ${missing.join(', ')}`)
}


function load_icon(name) {
  /** Read a bootstrap icon and return { name, view, body } where body is its inner markup. */
  const file = path.join(ICON_DIR, `${name}.svg`)
  if (!fs.existsSync(file)) throw new Error(`icons: unknown icon '${name}'`)

  const svg  = fs.readFileSync(file, 'utf8')
  const open = svg.match(/<svg[^>]*viewBox="0 0 16 16"[^>]*>/)
  if (!open) throw new Error(`icons: '${name}.svg' is not a 16x16 bootstrap icon`)

  const body = svg.slice(open.index + open[0].length, svg.lastIndexOf('</svg>')).trim()
  return { name, view: VIEW, body }
}


module.exports = { ICON_DIR, ICON_ROLES, VIEW, check_registry, load_icon }
