# hark-ornithology

Personal birding project; primarily using Cornell Lab tools and services
(eBird, Macaulay Library, Merlin Bird ID). A Next.js site turns exported
eBird data into a browsable dashboard — map, checklists, media, and
written field notes.

## Layout

- **`web/`** — the Next.js site. See `web/README.md` for the standard
  Next.js setup instructions and `web/usage.md` for a tour of the
  codebase aimed at non-developers editing content or styling.
- **`observation-data/`** — eBird CSV exports that power the site
  (`ebird-data-latest.csv`, `ebird-media-latest.csv`). `archive/` holds
  dated snapshots of earlier pulls, kept for history.
- **`web/field-notes/`** — Markdown blog posts rendered in the site's
  "Notes" section. See `web/field-notes/README.md` to add one.
- **`notebook/`** — personal trip-planning notes and field guide PDFs;
  reference material, not used by the site.
- **`tools/`** — small standalone utility scripts. See `tools/README.md`.

## Running the site locally

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. The site reads data from `observation-data/`
and `web/field-notes/` at build/request time — no database required.

## Updating data

Drop new eBird CSV exports into `observation-data/`, replacing
`ebird-data-latest.csv` / `ebird-media-latest.csv` (or point at a
different file via `data file name` in `public/options.csv`). See
`web/usage.md` for the full list of site options.
