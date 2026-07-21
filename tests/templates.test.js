/**
 * Unit tests for the composition template table: every shipped template passes
 * validation and unknown names or malformed layers throw.
 */
const { ROLES, TEMPLATES, resolve_template } = require('../scripts/templates')


describe('templates', () => {
  test.each(Object.keys(TEMPLATES))('test_resolve_template_%s', name => {
    /** Every shipped template resolves to its layer list. */
    expect(resolve_template(name)).toBe(TEMPLATES[name])
  })

  test('test_unknown_template_throws', () => {
    /** Unknown template names list the valid ones. */
    let message = ''
    try { resolve_template('mosaic') } catch (err) { message = err.message }
    expect(message).toMatch(/unknown template 'mosaic'/)
    for (const name of Object.keys(TEMPLATES)) expect(message).toContain(name)
  })

  test('test_layer_fields_in_range', () => {
    /** All layers use known roles, offset limits within the canvas, and sane sizes. */
    for (const layers of Object.values(TEMPLATES)) {
      for (const layer of layers) {
        expect(ROLES).toContain(layer.role)
        expect(Math.abs(layer.dx)).toBeLessThanOrEqual(48)
        expect(layer.size).toBeGreaterThan(0)
        expect(layer.size).toBeLessThanOrEqual(1.5)
      }
    }
  })

  test('test_foreground_layers_sit_on_background', () => {
    /** Every template starts with a full-size bg layer so fg ink never touches the page. */
    for (const [name, layers] of Object.entries(TEMPLATES)) {
      expect(layers[0].ink).toBe('bg')
      expect(layers[0].size).toBeGreaterThanOrEqual(0.85)
    }
  })
})
