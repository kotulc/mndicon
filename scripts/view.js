/**
 * Local viewer server for mndicon.
 * Zero-dependency http server that serves the single-page viewer, regenerates
 * candidate sets on demand, and writes the selected assets to disk on save.
 */
const fs   = require('fs')
const http = require('http')
const path = require('path')
const yaml = require('js-yaml')
const { SCHEMES, bake_colors, resolve_scheme } = require('./colors')
const { TYPESETS } = require('./compose')
const { ICON_ROLES, load_icon } = require('./icons')
const { generate_candidates, title_parts } = require('./generate')


const PAGE = path.join(__dirname, '..', 'viewer', 'index.html')

// Icon name -> inner markup, sent once so the viewer's icon dropdowns can swap in place
const ICON_BODIES = Object.fromEntries(
  Object.values(ICON_ROLES).flat().map(name => [name, load_icon(name).body])
)


function create_server(config) {
  /** Build the viewer http server holding the current candidate set. */
  let current = payload(config, generate_candidates(config))

  return http.createServer((req, res) => {
    const send = (code, type, body) => { res.writeHead(code, { 'Content-Type': type }); res.end(body) }
    const json = (code, data) => send(code, 'application/json', JSON.stringify(data))

    if (req.method === 'GET' && req.url === '/') return send(200, 'text/html', fs.readFileSync(PAGE))
    if (req.method === 'GET' && req.url === '/api/candidates') return json(200, current)
    if (req.method !== 'POST') return json(404, { error: 'not found' })

    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {}
        if (req.url === '/api/regenerate') {
          const seed = Number.isInteger(data.seed) ? data.seed : Date.now() % 1e9
          current = payload(config, generate_candidates({ ...config, seed }))
          return json(200, current)
        }
        if (req.url === '/api/save') return json(200, save_candidate(config, current, data))
        json(404, { error: 'not found' })
      } catch (err) {
        json(400, { error: err.message })
      }
    })
  })
}


function payload(config, { seed, candidates }) {
  /** Viewer JSON: candidates plus the global scheme, title, and typeset options. */
  const schemes = ['grey', ...Object.keys(SCHEMES)].map(name => ({ name, ...resolve_scheme(name) }))
  const { parts, sep } = title_parts(config)
  return {
    title: config.title, title_parts: parts, sep, seed, schemes, typesets: TYPESETS,
    icon_roles: ICON_ROLES, icon_bodies: ICON_BODIES, candidates,
  }
}


function save_candidate(config, current, data) {
  /** Bake the chosen scheme into the candidate's SVGs and write all assets. */
  const cand = current.candidates[data.index]
  if (!cand) throw new Error(`save: no candidate at index ${data.index}`)

  // Prefer the viewer's current colors (custom or preset); fall back to a scheme name
  const custom = data.colors && [data.colors.fg, data.colors.bg].every(c => /^[#a-z0-9(),.% ]+$/i.test(c || ''))
  const colors = custom ? { fg: data.colors.fg, bg: data.colors.bg } : resolve_scheme(data.scheme || 'grey')

  // The viewer sends its component-tuned SVGs; fall back to the stored composition
  const sent  = svg => typeof svg === 'string' && svg.startsWith('<svg') ? svg : null
  const files = {
    'icon.svg': bake_colors(sent(data.svg_icon) || cand.svg_icon, colors),
    'logo.svg': bake_colors(sent(data.svg_logo) || cand.svg_logo, colors),
    'brand.yaml': yaml.dump({
      title: config.title, seed: cand.seed, template: cand.template,
      icons: data.icons || cand.icons, scheme: data.scheme, colors,
    }),
  }
  for (const [px, url] of Object.entries(data.pngs || {})) {
    files[`favicon-${px}.png`] = Buffer.from(url.split(',')[1], 'base64')
  }

  fs.mkdirSync(config.output, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(config.output, name), content)
  }
  return { saved: Object.keys(files).map(name => path.join(config.output, name)) }
}


module.exports = { create_server, save_candidate }
