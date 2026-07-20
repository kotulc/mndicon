/**
 * Unit tests for scheme resolution and baking concrete colors into
 * composed SVG strings.
 */
const { GREY, SCHEMES, bake_colors, resolve_scheme } = require('../scripts/colors')


describe('resolve_scheme', () => {
  test.each(Object.keys(SCHEMES))('test_resolve_scheme_%s', name => {
    /** Every scheme resolves to a near-white fg over a mid-tone bg. */
    const { fg, bg } = resolve_scheme(name)
    expect(fg).toMatch(/^hsl\(\d+ \d+% 9\d%\)$/)
    expect(bg).toMatch(/^hsl\(\d+ \d+% 45%\)$/)
  })

  test('test_resolve_scheme_grey', () => {
    /** The 'grey' scheme returns the greyscale pair unchanged. */
    expect(resolve_scheme('grey')).toEqual(GREY)
  })

  test('test_resolve_scheme_unknown_throws', () => {
    /** Unknown scheme names list the valid ones. */
    expect(() => resolve_scheme('mauve')).toThrow(/unknown scheme 'mauve'.*grey, blue/)
  })
})


describe('bake_colors', () => {
  test('test_bake_colors_replaces_vars', () => {
    /** Both var(--fg/--bg) forms are replaced and no var() references remain. */
    const svg = '<g fill="var(--fg, #fafafa)"/><g fill="var(--bg, #52525b)"/>'
    const out = bake_colors(svg, { fg: 'hsl(1 2% 3%)', bg: 'hsl(4 5% 6%)' })
    expect(out).toBe('<g fill="hsl(1 2% 3%)"/><g fill="hsl(4 5% 6%)"/>')
    expect(out).not.toMatch(/var\(--/)
  })
})
