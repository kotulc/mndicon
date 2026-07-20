# MndIcon
Generative branding via svg icon composition 

## Purpose
MndIcon is a branding utility intended to augment MdSite (https://github.com/kotulc/mdsite) by supporting theme based logo generation. This utility produces several sample icons, logos, font styles and color themes for a given site title. 


## About
This config driven utility returns one candidate set of icons, logos, and color themes per composition template. This utility may also be used to view each candidate set and select suggested color themes that then get applied to each candidate. Candidate assets may then be saved locally.

Sample color themes are randomly selected from standard complementary color sets.

The user only needs to supply the site title, logo compositions and color schemes are randomly selected and optionally presented to the user. 


## Usage
Install dependencies, then either open the selection viewer or generate headlessly:

```sh
npm install
npm run view                                # viewer at http://localhost:8646 (uses mndicon.yaml)
node scripts/cli.js view --title "My Site"  # or configure entirely by flags
node scripts/cli.js generate --seed 7       # headless: greyscale svgs + candidates.yaml
```

Configuration lives in `mndicon.yaml` (only `title` is required); flags `--title --seed
--out --port --config` override it. The title may be a plain string (`My Site`) or a list of
individually styleable parts (`["M", "n", "D", "Icon"]`, rendered adjacently). One candidate
is generated per template; each shows its favicon previews beside the large icon on both
light and dark panels, greyscale first. Global controls cover preset complementary pairs,
primary/secondary color pickers, a `title` toggle, seeded Regenerate, and the title tuner
(per-part show/color/weight/size/position plus a typeset dropdown). The icon tuner follows
the selected candidate card (click to select, first by default): per-layer icon dropdowns,
show/size/position sliders, and rect width/height/roundness. Save serializes the tuned SVGs
and writes `icon.svg`, `logo.svg`, `favicon-16/32.png` and a `logo.yaml` provenance record.
Favicons are rasterized in the browser, so saved output matches the preview.

See [docs/customizing.md](docs/customizing.md) for editing icons, color schemes, and templates
(including the supported SVG composition operations), and
[docs/architecture.md](docs/architecture.md) for how each component is wired.

Composition templates are plain data in `scripts/templates.js`: each template is an ordered
list of layers on the 96x96 canvas with `role` (icon pool, or `rect` = canvas fill), `dx`
(absolute horizontal offset from center in pixels), `size`, `ink` (`fg`/`bg` color slot) and
optional `cut` (subtract from the layer below) — edit or add entries there to change
compositions.

There are several templates used for icon compositions:
- Overlay: Background icons are offset and overlaid with contrasting colors
- Cutout: The foreground icon is subtracted from the solid background icon
- Frame: The foreground icon is framed by the enlarged background icon (think badge)

Only the icons are randomized — every layer position is absolute as defined in its template
(a horizontal pixel offset from center). Every template keeps a solid backing (icon or canvas
rect) beneath foreground ink so one color set reads on light and dark pages alike.

## Registered icon sets
Icons are pulled from https://icons.getbootstrap.com/icons/

Background - These are icons appropriate to serve as background  and come in frame or solid variations
- Frame: "app", "shield", "chat-square", "square", "file", "hexagon", "octagon", "triangle"
- Solid: "square-fill", "shield-fill", "chat-fill", "file-fill", "hexagon-fill", "octagon-fill", "triangle-fill"

Foreground - These are icons appropriate to sit ontop of a background icon and are typically more detailed: Examples include "caret-down/left/right/up-fill", "arrow-left/right/up/down", "activity", "box", "boxes", "braces", "chevron-bar-expand", "chevron-expand", "crop", "diamond-half"


## Composition steps
normalize icons to common viewbox
Scale and position icons according to the selected template
Render icon and icon + title to svg
Rasterize to 16x16 and 32x32 favicons
Present logo (logo, favicons, logo + title) and color theme to user


## Workflow
Programmatic svg composition and color theming engine:
1. Collect svg (download locally)
2. Randomly select icon templates
3. Randomly select appropriate icon sets based on templates
2. Compose randomly selected icon sets per their templates
3. Optimize (rasterize)
4. Select preffered icon set + color theme and save (UI)

Composition objects:
Template, primary icon, secondary icon, color palette (bg/fg)
