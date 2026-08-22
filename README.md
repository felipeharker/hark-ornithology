# hark-ornithology

Personal birding project; primarily using Cornell Lab tools and services
(eBird, Macaulay Library, Merlin Bird ID). A Next.js site turns exported eBird
data into a browsable report — map, location index, checklists, media, and
written field notes.

## Layout

- **`web/`** — the site. See [`web/README.md`](web/README.md) for how it is put
  together and [`user_guide.md`](user_guide.md) for a non-developer's guide to
  editing every part of it.
- **`observation-data/`** — eBird CSV exports that power the site
  (`ebird-data-latest.csv`, `ebird-media-latest.csv`). `archive/` holds dated
  snapshots of earlier pulls, kept for history and never read by the site.
- **`web/content/`** — prose files rendered on the site (the abstract).
- **`web/field-notes/`** — Markdown trip reports rendered in the site's Field
  Notes section. See [`web/field-notes/README.md`](web/field-notes/README.md).
- **`public/options.csv`** — site title, accent color, and which observation CSV
  to read.
- **`notebook/`** — personal trip-planning notes and field guide PDFs; reference
  material, not used by the site.

## Running the site locally

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. Everything is read from `observation-data/`,
`web/content/`, and `web/field-notes/` at build time — no database.

## Updating data

Drop new eBird exports into `observation-data/`, replacing
`ebird-data-latest.csv` / `ebird-media-latest.csv` (or point at a different file
via `data file name` in `public/options.csv`). Rebuild and the whole site
follows.

## Design

The site shares one visual language with its sibling project, [Alexandria
Library](https://github.com/felipeharker/alexandria_script_library_master): a
printed technical paper — serif prose, monospace for recorded data, black rules,
one deep-red accent. It is documented at `/design-standards` on the running
site, and implemented in two annotated stylesheets,
`web/src/app/styles_primary.css` and `web/src/app/styles_map.css`.
