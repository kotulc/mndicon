# mndicon architecture

Developer documentation: how the modules are wired, what flows between them,
and the contracts each side relies on. Everything is CommonJS in `scripts/`;
each module has a single purpose and its tests mirror it in `tests/`.


## Module map

```
mndicon.yaml ── config.js ──┐
                            ▼
icons.js ──┐            generate.js ── candidates ── view.js ── viewer/index.html
templates.js ─┤             │                          │  ▲
colors.js ────┘         compose.js                     │  └── /api/* (fetch)
                                                       ▼
                                                 output dir (svg/png/yaml)
```

| module | purpose | exports |
|--------|---------|---------|
| `config.js` | YAML + CLI flag merge, validation, title-part normalization | `load_config`, `DEFAULTS`, `FLAG_KEYS` |
| `icons.js` | curated role registry + bootstrap-icons loader | `ICON_ROLES`, `load_icon`, `check_registry`, `VIEW` |
| `templates.js` | declarative layer tables + validator | `TEMPLATES`, `ROLES`, `PRIMITIVES`, `resolve_template` |
| `colors.js` | scheme table, greyscale pair, color baking | `SCHEMES`, `GREY`, `resolve_scheme`, `bake_colors` |
| `compose.js` | pure layers -> SVG strings | `compose_icon`, `compose_logo`, `place`, `CANVAS`, `TYPESETS` |
| `generate.js` | seeded candidate assembly | `generate_candidates`, `create_rng`, `pick`, `title_parts` |
| `view.js` | zero-dep http server: page, payload, save | `create_server`, `save_candidate` |
| `cli.js` | `view` (serve) and `generate` (headless) commands | `parse_args` |


## Data flow

1. **config**: `load_config(path, flags)` merges `DEFAULTS <- YAML <- flags`,
   validates, and normalizes the title: string -> word parts (`sep: ' '`),
   list -> explicit parts (`sep: ''`). Downstream code uses
   `title_parts`/`sep`; `title` is the joined display string.

2. **generate**: `generate_candidates(config)` seeds a mulberry32 stream
   (`config.seed` or `Date.now() % 1e9`) and builds **one candidate per
   template**, in `TEMPLATES` order. The stream drives only icon picks, in a
   fixed order, so one integer seed reproduces the whole set (this is the
   mdsite `logo_seed` compatibility contract). Each candidate:

   ```js
   { index, seed, template, icons: {role: name}, svg_icon, svg_logo }
   ```

3. **compose**: pure string building, no I/O. `compose_icon(layers, uid)`
   renders a 96x96 SVG; `compose_logo(layers, parts, sep, uid)` appends the
   title as `<tspan data-part="i">` runs in `currentColor`. Key invariants:
   - Fills are only `var(--fg, ...)`/`var(--bg, ...)` — recoloring is a CSS
     variable change; `bake_colors()` regexes in concrete values for saved
     files.
   - Every component carries `data-role` (+ `data-size`/`data-dx` base
     geometry) so the viewer can retune the DOM without recomposing.
   - `cut` layers emit a `<mask id="{uid}cut{i}">` applied to the previous
     layer; `uid` (`c{index}-`) keeps ids unique across candidates.
   - `place(size, dx)` is the one placement formula (16-unit icon -> canvas);
     the viewer duplicates these ~3 lines in `apply()` to recompute
     transforms client-side.

4. **view server**: holds the current payload in memory.
   - `GET /` — the single-file viewer page.
   - `GET /api/candidates` — payload: candidates plus everything the client
     tunes with: resolved `schemes`, `typesets`, `title_parts`/`sep`,
     `icon_roles`, and `icon_bodies` (name -> inner markup, enabling instant
     icon swaps client-side).
   - `POST /api/regenerate` `{seed?}` — new candidate set (given or fresh
     seed).
   - `POST /api/save` — writes `icon.svg`, `logo.svg`, `favicon-16/32.png`,
     `logo.yaml` to `config.output`. Prefers the client's serialized
     (component-tuned, color-baked) SVGs and colors; falls back to the stored
     composition and scheme name so the endpoint also works headlessly.

5. **viewer client** (`viewer/index.html`, no framework): fetches the payload
   and renders candidate cards; all editing is direct inline-SVG DOM
   manipulation:
   - **Colors**: primary (`--bg`) and secondary (`--fg`) as H/S/L slider
     groups (Nextra-style); presets seed the sliders; two CSS custom
     properties on the grid recolor every candidate at once.
   - **Tuner**: title rows are global; the icon group binds to the selected
     card. `apply()` walks `[data-role]` nodes and rewrites
     transform/geometry from base `data-*` attributes x tuner state. Rect
     width is a fraction of the *owning* svg's viewBox width, so 1.0 spans
     the icon canvas in `icon.svg` and the full icon + title width in
     `logo.svg`.
   - **Instance ids**: each injected svg copy gets mask ids suffixed
     (`-i{n}`) because browsers resolve `url(#id)` document-wide and fail to
     apply masks across separate inline svg fragments.
   - **Save**: serializes the tuned icon and logo (`XMLSerializer`), fits the
     logo viewBox via `getBBox()`, bakes colors, rasterizes favicons through
     an offscreen canvas, and POSTs everything.

6. **cli**: `view` = generate + serve; `generate` = headless write of every
   candidate's greyscale SVGs + `candidates.yaml` (the seam a future mdsite
   build step can call).


## Contracts worth preserving

- **Determinism**: same seed -> deep-equal candidates. Never add an rng call
  conditionally; picks must happen in a fixed order.
- **Greyscale-first**: compose emits no literal colors outside `var()`
  fallbacks (tested). Color is applied by CSS in the viewer or baked at save.
- **`data-*` base geometry**: the viewer recomputes from
  `data-size`/`data-dx`, never parses transforms. New primitives must ship
  their base geometry the same way.
- **mdsite seams**: integer seed (`logo_seed`), scheme names matching mdsite
  `COLOR_PRESETS` hues, and `logo.yaml` as the provenance/handoff record.


## Testing

Jest, node environment, one test file per module (`tests/<module>.test.js`).
`icons.test.js` pins the registry to the installed bootstrap-icons package;
`view.test.js` boots the real server on an ephemeral port and exercises every
endpoint including save-to-tmp-dir. Run with `npm test`.
