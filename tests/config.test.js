/**
 * Unit tests for YAML config loading: defaults, validation errors,
 * CLI flag overrides, and output path resolution.
 */
const fs   = require('fs')
const os   = require('os')
const path = require('path')

const { load_config, DEFAULTS } = require('../scripts/config')


let tmp
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mndicon-config-')) })
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

function write_yaml(body) {
  const p = path.join(tmp, 'mndicon.yaml')
  fs.writeFileSync(p, body)
  return p
}


describe('load_config', () => {
  test('test_defaults_applied', () => {
    /** A minimal config gets every DEFAULTS value and resolves output near the YAML. */
    const cfg = load_config(write_yaml('title: t'))
    expect(cfg.seed).toBeNull()
    expect(cfg.port).toBe(DEFAULTS.port)
    expect(cfg.output).toBe(path.resolve(tmp, 'brand'))
  })

  test('test_title_string_to_parts', () => {
    /** A string title splits into word parts joined by spaces. */
    const cfg = load_config(write_yaml('title: My Site'))
    expect(cfg.title_parts).toEqual(['My', 'Site'])
    expect(cfg.sep).toBe(' ')
    expect(cfg.title).toBe('My Site')
  })

  test('test_title_list_to_parts', () => {
    /** A list title keeps its styleable parts and renders them adjacently. */
    const cfg = load_config(write_yaml('title: ["M", "n", "D", "Icon"]'))
    expect(cfg.title_parts).toEqual(['M', 'n', 'D', 'Icon'])
    expect(cfg.sep).toBe('')
    expect(cfg.title).toBe('MnDIcon')
  })

  test('test_missing_title_throws', () => {
    /** title is the only required field. */
    expect(() => load_config(write_yaml('port: 1234'))).toThrow(/'title' is required/)
  })

  test('test_flags_override_yaml', () => {
    /** CLI flags win over YAML values and numeric strings are coerced. */
    const cfg = load_config(write_yaml('title: t\nseed: 1'), { title: 'flag', seed: '42' })
    expect(cfg.title).toBe('flag')
    expect(cfg.seed).toBe(42)
  })

  test('test_no_yaml_with_title_flag', () => {
    /** A missing config file is fine when flags supply the title. */
    const cfg = load_config(path.join(tmp, 'absent.yaml'), { title: 't' })
    expect(cfg.title).toBe('t')
  })

  test('test_invalid_seed_throws', () => {
    /** seed must be an integer when given. */
    expect(() => load_config(write_yaml('title: t\nseed: abc'))).toThrow(/'seed' must be an integer/)
  })
})
