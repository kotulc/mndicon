# Customizing mndicon

How to change the icons, color schemes, and composition templates that drive
candidate generation. All three are plain data tables in `scripts/` — edit the
table, run `npm test` to validate, and restart the viewer.


## Icons (`scripts/icons.js`)

`ICON_ROLES` maps each composition role to a curated list of Bootstrap icon
names (https://icons.getbootstrap.com):

- `frame` — outline shapes suited to framing (e.g. `shield`, `hexagon`)
- `solid` — filled shapes suited to backing (e.g. `square-fill`)
- `fore`  — detailed foreground glyphs (e.g. `activity`, `braces`)

To add an icon, append its name to the matching role list. The name must exist
as `node_modules/bootstrap-icons/icons/<name>.svg`; `tests/icons.test.js` and a
CLI startup check verify every registered name, so a typo fails loudly. All
bootstrap icons share a 16x16 viewBox — the loader rejects anything else.


## Color schemes (`scripts/colors.js`)

`SCHEMES` maps a scheme name to `[background hue, foreground tint hue]`. The
resolver applies one formula to every scheme so all pairs stay legible on both
light and dark pages:

- background: `hsl(<hue> 65% 45%)` — saturated mid-tone, visible on any page
- foreground: `hsl(<tint> 80% 93%)` — near-white with a complementary tint

To add a scheme, add a `name: [hue, tint]` entry (tint is typically hue + 180).
Scheme names and hues intentionally mirror mdsite's Tailwind-600 presets in
`mdsite/scripts/theme.js`, so a chosen scheme maps 1:1 onto `theme.color`
there. `GREY` is the always-present greyscale pair shown first in the viewer.

In the viewer, presets are starting points: the primary (background) and
secondary (foreground) hue/saturation/lightness sliders adjust the applied
colors dynamically, Nextra-style.


## Templates (`scripts/templates.js`)

A template is an ordered list of layers drawn back-to-front on a 96x96 canvas.
Each layer is one record:

| field  | meaning |
|--------|---------|
| `role` | what fills the slot: an icon pool (`frame`/`solid`/`fore`) or a primitive (`rect`/`circle`) |
| `dx`   | absolute horizontal offset from center, in canvas pixels (-48..48) |
| `size` | scale relative to the canvas; 1 = full canvas |
| `ink`  | color slot the layer paints with: `fg` or `bg` |
| `cut`  | `true` = subtract this layer from the layer below instead of painting |

### Supported composition operations

- **Paint** (default): the layer renders filled with its `ink` slot. Icon
  layers are scaled/translated icon markup; primitives are canvas shapes
  (`rect` = rounded rectangle, `circle` = centered circle). Layers stack in
  list order, later over earlier.
- **Offset**: `dx` shifts a layer horizontally; layers stay vertically
  centered. Positions are deterministic — only icon choices are randomized.
- **Cut** (subtraction): a `cut: true` layer becomes an SVG `<mask>` (white
  canvas + the layer's shape in black) applied to the layer directly below it,
  punching an icon-shaped hole that shows the page through. A cut layer needs
  a layer below it and takes no `ink`.

### Design rule: solid backing

Keep the first layer a full-size `bg`-ink backing (a solid icon, `rect`, or
`circle`). Foreground ink then always sits on the backing, which is what lets
one color set work on light and dark pages (`tests/templates.test.js` enforces
this).

### Adding a template

Add a named layer list to `TEMPLATES` — one candidate per template is
generated, in table order:

```js
badge: [
  { role: 'circle', dx: 0,  size: 1.0, ink: 'bg' },
  { role: 'fore',   dx: 0,  size: 0.5, ink: 'fg' },
  { role: 'fore',   dx: 30, size: 0.3, cut: true },
],
```

### Adding a new composition operation

Operations live in `scripts/compose.js`:

1. New primitive shape: add its name to `ROLES`/`PRIMITIVES` in
   `templates.js`, add a branch in `paint_layer()` emitting the element with
   `data-role` (plus `data-size`/`data-dx` if the viewer should retune it),
   and teach the viewer's `apply()` how to resize/move it.
2. New layer effect (like `cut`): handle the layer flag in `render_layers()`.
   SVG gives you masks, clip-paths, filters, and transforms — emit the def,
   then attach the reference attribute to the target layer.

Add a `tests/compose.test.js` case asserting the emitted markup.


## Viewer tuning vs. table editing

The viewer's tuner (component show/size/position, rect roundness, icon
dropdowns, title styling) adjusts the current session and what gets saved —
it does not modify the tables. When a tuned look should become the default,
copy the values back into `TEMPLATES`.
