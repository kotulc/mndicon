# MndIcon
Generative branding via svg icon composition 

## Purpose
MndIcon is a branding utility intended to augment MdSite (https://github.com/kotulc/mdsite) by supporting theme based logo generation. This utility produces several sample icons, logos, font styles and color themes for a given site title. 


## About
This config driven utility returns n_candidates (defaults to 3) sets of icons, logos, and color themes. This utility may also be used to view each candidate set and select suggested color themes that then get applied to each candidate. Candidate assets may then be saved locally.

Sample color themes are randomly selected from standard complementary color sets.

The user only needs to supply the site title, logo compositions and color schemes are randomly selected and optionally presented to the user. 

There are several templates used for icon compositions:
- Overlay: Background icons are offset and overlaid with contrasting colors
- Cutout: The foreground icon is subtracted from the solid background icon
- Frame: The foreground icon is framed by the enlarged background icon (think badge)
- Character: A character or set of characters (based on title word length) and selected icon are combined and offset

Offsets are standardized on a 1/3 grid (from center)

## Registered icon sets
Icons are pulled from https://icons.getbootstrap.com/icons/

Background - These are icons appropriate to serve as background  and come in frame or solid variations
- Frame: "app", "shield", "chat-square", "squre", "file", "hexagon", "octagon", "triangle"
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
Template, primary icon/characters secondary icon, color palette (bg/fg)
