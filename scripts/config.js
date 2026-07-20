/**
 * YAML config loader for the mndicon CLI.
 * Reads mndicon.yaml (optional when flags supply a title), applies defaults and
 * CLI flag overrides, and validates the fields used to generate candidates.
 */
const fs   = require('fs')
const path = require('path')
const yaml = require('js-yaml')


const DEFAULTS = {
  title:        '',
  n_candidates: 3,
  seed:         null,
  output:       './brand',
  port:         8646,
}

// CLI flag name -> config key (flags override YAML values)
const FLAG_KEYS = { title: 'title', n: 'n_candidates', seed: 'seed', out: 'output', port: 'port' }


function load_config(yaml_path, flags = {}) {
  /** Merge DEFAULTS <- YAML (if present) <- CLI flags; validate and resolve output path. */
  const abs = path.resolve(yaml_path || 'mndicon.yaml')
  const dir = fs.existsSync(abs) ? path.dirname(abs) : process.cwd()
  const raw = fs.existsSync(abs) ? yaml.load(fs.readFileSync(abs, 'utf8')) || {} : {}
  const cfg = { ...DEFAULTS, ...raw }

  for (const [flag, key] of Object.entries(FLAG_KEYS)) {
    if (flags[flag] !== undefined) cfg[key] = flags[flag]
  }
  for (const key of ['n_candidates', 'seed', 'port']) {
    if (typeof cfg[key] === 'string') cfg[key] = parseInt(cfg[key], 10)
  }

  if (!cfg.title || (Array.isArray(cfg.title) && !cfg.title.length)) {
    throw new Error(`mndicon.yaml: 'title' is required`)
  }

  // Title may be a string ("My Site") or a list of styleable parts (["M", "n", "D", "Icon"]);
  // list parts render adjacently while string words keep their separating spaces
  cfg.sep         = Array.isArray(cfg.title) ? '' : ' '
  cfg.title_parts = (Array.isArray(cfg.title) ? cfg.title : String(cfg.title).trim().split(/\s+/)).map(String)
  cfg.title       = cfg.title_parts.join(cfg.sep)
  if (!Number.isInteger(cfg.n_candidates) || cfg.n_candidates < 1) {
    throw new Error(`mndicon.yaml: 'n_candidates' must be a positive integer`)
  }
  if (cfg.seed !== null && !Number.isInteger(cfg.seed)) {
    throw new Error(`mndicon.yaml: 'seed' must be an integer`)
  }

  cfg.output = path.resolve(dir, cfg.output)
  return cfg
}


module.exports = { load_config, DEFAULTS, FLAG_KEYS }
