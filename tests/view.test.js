/**
 * Integration tests for the viewer server: page and candidate endpoints,
 * deterministic regeneration, and asset writing on save.
 */
const fs   = require('fs')
const http = require('http')
const os   = require('os')
const path = require('path')

const { create_server } = require('../scripts/view')

// 1x1 transparent PNG, the smallest valid rasterization payload
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ' +
            'AAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='


let tmp, server, port
beforeEach(done => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mndicon-view-'))
  server = create_server({ title: 'My Site', seed: 7, output: tmp })
  server.listen(0, () => { port = server.address().port; done() })
})
afterEach(done => {
  fs.rmSync(tmp, { recursive: true, force: true })
  server.close(done)
})

function request(method, url, body) {
  /** Promise-wrapped http request returning { status, data } with parsed JSON. */
  return new Promise((resolve, reject) => {
    const req = http.request({ host: 'localhost', port, path: url, method }, res => {
      let raw = ''
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => resolve({
        status: res.statusCode,
        data: res.headers['content-type'].includes('json') ? JSON.parse(raw) : raw,
      }))
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}


describe('view server', () => {
  test('test_get_page', async () => {
    /** GET / serves the self-contained viewer page. */
    const { status, data } = await request('GET', '/')
    expect(status).toBe(200)
    expect(data).toMatch(/<title>mndicon<\/title>/)
  })

  test('test_get_candidates', async () => {
    /** GET /api/candidates returns the seeded set plus global resolved schemes. */
    const { status, data } = await request('GET', '/api/candidates')
    expect(status).toBe(200)
    expect(data.seed).toBe(7)
    expect(data.candidates.map(c => c.template)).toEqual(['overlay', 'cutout', 'frame'])
    expect(data.schemes[0]).toMatchObject({ name: 'grey' })
    expect(data.schemes[1].fg).toMatch(/^hsl\(/)
    expect(data.title_parts).toEqual(['My', 'Site'])
    expect(Object.keys(data.typesets)).toContain('geometric')
    expect(data.icon_roles.fore).toContain('activity')
    expect(data.icon_bodies.activity).toMatch(/<path/)
  })

  test('test_regenerate_deterministic', async () => {
    /** POST /api/regenerate with a fixed seed returns identical sets. */
    const a = await request('POST', '/api/regenerate', { seed: 99 })
    const b = await request('POST', '/api/regenerate', { seed: 99 })
    expect(a.data).toEqual(b.data)
    expect(a.data.seed).toBe(99)
  })

  test('test_save_writes_assets', async () => {
    /** POST /api/save bakes the sent colors and writes svg, png, and brand.yaml. */
    const { status, data } = await request('POST', '/api/save',
      { index: 0, scheme: 'custom', colors: { fg: '#ffffff', bg: '#336699' }, pngs: { 16: PNG, 32: PNG } })
    expect(status).toBe(200)
    expect(data.saved).toHaveLength(5)
    const names = fs.readdirSync(tmp).sort()
    expect(names).toEqual(['brand.yaml', 'favicon-16.png', 'favicon-32.png', 'icon.svg', 'logo.svg'])
    const icon = fs.readFileSync(path.join(tmp, 'icon.svg'), 'utf8')
    expect(icon).not.toMatch(/var\(--/)
    expect(icon).toContain('#336699')
  })

  test('test_save_prefers_sent_svgs', async () => {
    /** Component-tuned SVGs sent by the viewer are baked and written verbatim. */
    const sent = '<svg xmlns="http://www.w3.org/2000/svg"><g fill="var(--bg, #52525b)"/></svg>'
    await request('POST', '/api/save',
      { index: 0, scheme: 'custom', colors: { fg: '#fff', bg: '#123456' }, svg_icon: sent })
    const icon = fs.readFileSync(path.join(tmp, 'icon.svg'), 'utf8')
    expect(icon).toBe(sent.replace('var(--bg, #52525b)', '#123456'))
  })

  test('test_save_bad_index_errors', async () => {
    /** Saving a missing candidate index returns a 400 with the error. */
    const { status, data } = await request('POST', '/api/save', { index: 9, scheme: 'grey' })
    expect(status).toBe(400)
    expect(data.error).toMatch(/no candidate at index 9/)
  })
})
