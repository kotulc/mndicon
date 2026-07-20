/**
 * mndicon CLI — generate icon/logo candidates and serve the selection viewer.
 * Usage: node scripts/cli.js [view|generate] [--config <path>] [--title <t>]
 *        [--seed <n>] [--out <dir>] [--port <p>]
 */
const fs   = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { load_config } = require('./config')
const { check_registry } = require('./icons')
const { generate_candidates } = require('./generate')
const { create_server } = require('./view')


function cmd_generate(config) {
  /** Headless: write every candidate's greyscale SVGs plus a candidates.yaml record. */
  const { seed, candidates } = generate_candidates(config)
  fs.mkdirSync(config.output, { recursive: true })

  const records = candidates.map(cand => {
    fs.writeFileSync(path.join(config.output, `icon-${cand.index}.svg`), cand.svg_icon)
    fs.writeFileSync(path.join(config.output, `logo-${cand.index}.svg`), cand.svg_logo)
    const { svg_icon, svg_logo, ...record } = cand
    return record
  })
  fs.writeFileSync(path.join(config.output, 'candidates.yaml'),
                   yaml.dump({ title: config.title, seed, candidates: records }))

  console.log(`mndicon generate — seed ${seed}`)
  console.log(`  wrote ${candidates.length} candidates to ${config.output}`)
}


function cmd_view(config) {
  /** Generate an initial candidate set and serve the viewer. */
  create_server(config).listen(config.port, () => {
    console.log(`mndicon viewer — http://localhost:${config.port}`)
    console.log(`  title: ${config.title}`)
  })
}


function parse_args(argv) {
  /** Parse command and named flags from process.argv (flags without a value are true). */
  const args    = argv.slice(2)
  const command = args[0] && !args[0].startsWith('--') ? args[0] : 'view'
  const flags   = {}
  for (let i = command === args[0] ? 1 : 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) continue
    if (args[i + 1] && !args[i + 1].startsWith('--')) flags[args[i].slice(2)] = args[++i]
    else flags[args[i].slice(2)] = true
  }
  return { command, flags }
}


// --- Main ---

if (require.main === module) {
  const { command, flags } = parse_args(process.argv)
  const commands = { view: cmd_view, generate: cmd_generate }

  if (!(command in commands)) {
    console.error(`Unknown command: ${command}`)
    console.error('Usage: node scripts/cli.js [view|generate] [--title <t>] [--seed <n>] ...')
    process.exit(1)
  }
  try {
    check_registry()
    commands[command](load_config(flags.config, flags))
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}


module.exports = { parse_args }
