/**
 * Unit tests for seeded candidate generation: determinism, registry-bound
 * picks, candidate counts, and title character extraction.
 */
const { ICON_ROLES } = require('../scripts/icons')
const { TEMPLATES } = require('../scripts/templates')
const { create_rng, generate_candidates } = require('../scripts/generate')


const CONFIG = { title: 'My Site', seed: 7 }


describe('generate_candidates', () => {
  test('test_same_seed_deep_equal', () => {
    /** The same seed reproduces the exact candidate set. */
    expect(generate_candidates(CONFIG)).toEqual(generate_candidates(CONFIG))
  })

  test('test_different_seeds_differ', () => {
    /** Different seeds produce different SVG output. */
    const a = generate_candidates(CONFIG)
    const b = generate_candidates({ ...CONFIG, seed: 8 })
    expect(a.candidates[0].svg_icon).not.toBe(b.candidates[0].svg_icon)
  })

  test('test_one_candidate_per_template', () => {
    /** Exactly one candidate per template, with every icon from the registered tables. */
    const { seed, candidates } = generate_candidates(CONFIG)
    expect(seed).toBe(7)
    expect(candidates.map(c => c.template)).toEqual(Object.keys(TEMPLATES))
    for (const cand of candidates) {
      for (const [role, name] of Object.entries(cand.icons)) expect(ICON_ROLES[role]).toContain(name)
      expect(cand.svg_icon).toMatch(/^<svg /)
      expect(cand.svg_logo).toMatch(/<tspan data-part="0">My<\/tspan> <tspan data-part="1">Site<\/tspan>/)
    }
  })

  test('test_random_seed_when_null', () => {
    /** A null seed still yields a reported integer seed. */
    const { seed } = generate_candidates({ ...CONFIG, seed: null })
    expect(Number.isInteger(seed)).toBe(true)
  })
})


describe('helpers', () => {
  test('test_create_rng_deterministic', () => {
    /** Same seed gives the same float stream, in [0, 1). */
    const a = create_rng(42), b = create_rng(42)
    for (let i = 0; i < 10; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

})
