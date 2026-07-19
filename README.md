# MndIcon
Generative branding via svg icon composition 

## Purpose
MndIcon is a branding utility intended to augment MdSite (https://github.com/kotulc/mdsite) by supporting theme based logo generation. This utility produces several sample logos for a given site title. 

## About
Return candidate sets of icons/logos/titles

Supply title and tags
Register icon sets
Define composition templates:
  Badge, overlay, split, cutout
normalize to common viewbox
Scale and position
Render to svg
Rasterize 16x16 and 32x32
Use LLM to rank options 

Programmatic svg composition and color theming engine. 1. Collect svg, 2. Compose, 3. Optimize, 4. Select (UI)

Composition object:
Template, primary, secondary, palette (bg/fg)

Create a series of templates
Overlay, cutout, frame, corner, union, character + icon, text + contrast