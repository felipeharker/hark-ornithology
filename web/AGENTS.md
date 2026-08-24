# Notes for coding agents

## Architecture

Next.js App Router, exported statically (`output: 'export'`). No server, no
database, no CSS framework. Content comes from files at build time — see the
table in [`README.md`](README.md).

## Rules

- **All styling lives in `src/app/styles_primary.css` and
  `src/app/styles_map.css`.** Do not add inline style objects, and do not
  reintroduce Tailwind or any other CSS framework. Add a commented class to the
  relevant numbered section of the stylesheet instead.
- **Design tokens first.** Both stylesheets open with a `:root` block. Prefer
  changing or adding a token over hardcoding a color, size, or spacing value.
- **Never hardcode content.** Observations and media come from the CSVs in
  `../observation-data/`, prose from `content/` and `field-notes/`, and site
  settings from `../public/options.csv`. A change that bakes a bird, a place, or
  a paragraph into a component is wrong.
- **The parsers in `src/lib/` map eBird's column headers to the field names the
  app uses.** Touch them only when eBird changes its export format.
- **Long lists are lists of native `<details>` rows.** Locations and Media are
  the same list twice: a section that stays open, one collapsible row per
  entry. Opening is the browser's, not React state — with one exception: a
  location row's `open` state is controlled, because selecting a map pin has to
  open it, and only one location is open at a time.
- **The design language is shared with Alexandria Library.** Before changing
  type, color, or rules, check `/design-standards` — a change here is a change
  to both projects' shared standard. Its current shape: Inter for headings and
  prose, IBM Plex Mono for recorded values only, hairline rules rather than
  heavy ones, three weights (400/500/600) and no bold, and no numbering on
  sections, subsections, figures or references.
- **Reuse the primitives in `src/components/ui/`.** `Section`, `Disclosure`
  and `Masthead` exist so that every page emits the same markup for the same
  thing. Assembling a heading or a title block by hand is how the pages drifted
  apart last time.
- **The `next/font` variable classes belong on `<html>`, not `<body>`.**
  `styles_primary.css` composes `--font-body` inside `:root`, and a custom
  property is substituted against the element it is declared on — put the
  classes lower and the token resolves to nothing, silently falling the whole
  site back to the browser's default serif.

## Verifying

`npm run build` (type-checks and pre-renders every page) and `npm run lint`
both have to pass. There is no test suite.
