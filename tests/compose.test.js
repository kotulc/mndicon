/**
 * Unit tests for SVG composition: placement math, cutout masks, character
 * text, variable-only painting, and icon/logo output structure.
 */
const { CANVAS, compose_icon, compose_logo, place } = require('../scripts/compose')


const SOLID = { role: 'solid', dx: 0, size: 1.0, ink: 'bg', body: '<path d="M0 0h16v16H0z"/>' }
const FORE  = { role: 'fore', dx: 22, size: 0.5, ink: 'fg', body: '<path d="M8 0 16 16H0z"/>' }
const CUT   = { role: 'fore', dx: 0, size: 0.5, cut: true, body: '<path d="M8 0 16 16H0z"/>' }
const RECT  = { role: 'rect', dx: 0, size: 1.0, ink: 'bg' }


describe('place', () => {
  test('test_place_centered_full_size', () => {
    /** A full-size centered layer fills the canvas exactly. */
    expect(place(1.0, 0)).toBe('translate(0 0) scale(6)')
  })

  test('test_place_offset_pixels', () => {
    /** A half-size layer offset 24px right: x = 48 + 24 - 24, y = 48 - 24. */
    expect(place(0.5, 24)).toBe('translate(48 24) scale(3)')
  })
})


describe('compose_icon', () => {
  test('test_icon_structure', () => {
    /** Output is a single-root 96x96 SVG with one <g> per painted layer. */
    const svg = compose_icon([SOLID, FORE])
    expect(svg).toMatch(new RegExp(`^<svg [^>]*viewBox="0 0 ${CANVAS} ${CANVAS}">.*</svg>$`))
    expect(svg.match(/<g /g)).toHaveLength(2)
  })

  test('test_icon_variables_only', () => {
    /** Every fill is a var(--fg/--bg) reference; no literal colors outside fallbacks. */
    const svg = compose_icon([SOLID, FORE])
    expect(svg.match(/fill="[^"]*"/g).every(f => f.includes('var(--'))).toBe(true)
  })

  test('test_icon_cutout_mask', () => {
    /** A cut layer emits a <mask> def and applies it to the layer below. */
    const svg = compose_icon([SOLID, CUT])
    expect(svg).toMatch(/<mask id="cut1">/)
    expect(svg).toMatch(/<g mask="url\(#cut1\)" data-role="solid"/)
  })

  test('test_icon_cut_first_throws', () => {
    /** A cut layer with nothing below it is a template error. */
    expect(() => compose_icon([CUT])).toThrow(/'cut' layer needs a layer below/)
  })

  test('test_icon_rect_canvas_fill', () => {
    /** Rect layers fill the canvas with a rounded rect in their ink slot. */
    const svg = compose_icon([RECT, FORE])
    expect(svg).toMatch(/<rect data-role="rect" x="0" y="0" width="96" height="96" rx="14" fill="var\(--bg[^)]*\)"\/>/)
  })

  test('test_icon_data_attributes', () => {
    /** Painted layers carry data-role/size/dx so the viewer can retune them. */
    const svg = compose_icon([SOLID, FORE])
    expect(svg).toMatch(/<g data-role="solid" data-size="1" data-dx="0"/)
    expect(svg).toMatch(/<g data-role="fore" data-size="0.5" data-dx="22"/)
  })

  test('test_icon_mask_id_prefix', () => {
    /** A uid prefixes mask ids so compositions can share one document. */
    const svg = compose_icon([SOLID, CUT], 'c2-')
    expect(svg).toMatch(/<mask id="c2-cut1">/)
    expect(svg).toMatch(/mask="url\(#c2-cut1\)"/)
  })
})


describe('compose_logo', () => {
  test('test_logo_title_parts', () => {
    /** Title parts render as styleable tspans, escaped, joined by the separator. */
    const svg = compose_logo([SOLID], ['A', '&', 'B'], ' ')
    expect(svg).toMatch(/fill="currentColor"><tspan data-part="0">A<\/tspan> <tspan data-part="1">&amp;<\/tspan> <tspan data-part="2">B<\/tspan><\/text>/)
    expect(svg).toMatch(/viewBox="0 0 \d+(\.\d+)? 96"/)
  })

  test('test_logo_list_parts_adjacent', () => {
    /** List-title parts render with no separator between tspans. */
    const svg = compose_logo([SOLID], ['Mn', 'D'], '')
    expect(svg).toMatch(/<tspan data-part="0">Mn<\/tspan><tspan data-part="1">D<\/tspan>/)
  })
})
