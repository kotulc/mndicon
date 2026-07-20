/**
 * Unit tests for the icon registry and loader: registry completeness against
 * the installed bootstrap-icons package and normalized load output.
 */
const { ICON_ROLES, VIEW, check_registry, load_icon } = require('../scripts/icons')


describe('icons', () => {
  test('test_check_registry_passes', () => {
    /** Every curated icon name resolves to a file in bootstrap-icons. */
    expect(() => check_registry()).not.toThrow()
  })

  test('test_load_icon_normalized', () => {
    /** Loaded icons expose the 16x16 view and non-empty inner markup. */
    for (const name of Object.values(ICON_ROLES).flat()) {
      const icon = load_icon(name)
      expect(icon.view).toBe(VIEW)
      expect(icon.body).toMatch(/<path/)
      expect(icon.body).not.toMatch(/<svg/)
    }
  })

  test('test_load_icon_unknown_throws', () => {
    /** Unregistered names fail loudly. */
    expect(() => load_icon('no-such-icon')).toThrow(/unknown icon 'no-such-icon'/)
  })
})
