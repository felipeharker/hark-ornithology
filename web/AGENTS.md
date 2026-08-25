# Notes for coding agents

## Architecture

Next.js App Router, exported statically (`output: 'export'`). No server, no
database, no CSS framework. Content comes from files at build time — see the
table in [`../README.md`](../README.md).

## Rules

- **All styling lives in `src/app/styles_primary.css` and
  `src/app/styles_map.css`.** Do not add inline style objects, and do not
  reintroduce Tailwind or any other CSS framework. Add a commented class to the
  relevant numbered section of the stylesheet instead.
- **Design tokens first.** Both stylesheets open with a `:root` block. Prefer
  changing or adding a token over hardcoding a color, size, or spacing value.
- **Observations are never hardcoded; the project's own settings always are.**
  Birds, places, counts, dates and media come from the CSVs in
  `../observation-data/`, and prose from `field-notes/`. A change that bakes one
  of those into a component is wrong. The site's title, subtitle, byline,
  abstract and off-site links are different in kind — they describe the project
  rather than record an observation — and they belong in `src/lib/siteConfig.ts`
  as plain exported constants. They were CSV and Markdown files once; reading
  them from disk bought nothing and cost a parser each.
- **`src/lib/parseEbird.ts` touches the filesystem, so only server components
  may import a *value* from it.** Importing the row types is fine — types are
  erased before bundling — but pulling a function out of it into a `'use client'`
  component drags `fs` into the browser bundle and fails the build. That is why
  `formatDate` sits in its own module: client components format dates too.
- **The field-name maps in `parseEbird.ts` are the only place eBird's column
  headers appear.** Touch them only when eBird changes its export format.
- **Long lists are lists of native `<details>` rows.** Locations and Media are
  the same list twice: a section that stays open, one collapsible row per
  place — Media groups by location and then by checklist inside the row, so a
  place appears once in both lists. Opening is the browser's, not React state
  — with one exception: a location row's `open` state is controlled, because
  selecting a map pin has to open it, and only one location is open at a time.
- **`/design-standards` states the design language.** Before changing type,
  color, or rules, check it — a change here is a change to the standard the
  whole site follows. Its current shape: Inter for headings and prose, IBM
  Plex Mono for recorded values only, hairline rules rather than heavy ones,
  three weights (400/500/600) and no bold, and no numbering on sections,
  subsections, figures or references.
- **Reuse the primitives in `src/components/ui/`.** `Section`, `Disclosure`
  and `Masthead` exist so that every page emits the same markup for the same
  thing. Assembling a heading or a title block by hand is how the pages drifted
  apart last time.
- **The `next/font` variable classes belong on `<html>`, not `<body>`.**
  `styles_primary.css` composes `--font-body` inside `:root`, and a custom
  property is substituted against the element it is declared on — put the
  classes lower and the token resolves to nothing, silently falling the whole
  site back to the browser's default serif.
- **`tsconfig.json` is rewritten by `next build`.** It re-adds `allowJs` and
  reformats the file; edits that fight it are churn, not cleanup.

## Verifying

`npm run build` (type-checks and pre-renders every page) and `npm run lint`
both have to pass. There is no test suite.
