# hark-ornithology

Personal birding project; primarily using Cornell Lab tools and services
(eBird, Macaulay Library, Merlin Bird ID). A Next.js site turns exported eBird
data into a browsable report — map, location index, checklists, media, and
written field notes.

## Layout

- **`web/`** — the site: a Next.js app exported as fully static HTML. There is
  no server and no database; every page is pre-rendered at build time.
- **`observation-data/`** — the eBird CSV exports that power the site
  (`ebird-data-latest.csv`, `ebird-media-latest.csv`).
- **`web/field-notes/`** — Markdown trip reports rendered in the site's Field
  Notes section, one file per note.
- **`notebook/`** — personal trip-planning notes and field guide PDFs; reference
  material, not used by the site.

[`user_guide.md`](user_guide.md) is the non-developer's guide to editing every
part of the site; [`web/AGENTS.md`](web/AGENTS.md) is the working brief for
coding agents.

## What builds each part of the page

| Source | What it produces |
|---|---|
| `observation-data/ebird-data-latest.csv` | Map pins, the location index, species tables, and one page per checklist. |
| `observation-data/ebird-media-latest.csv` | The Media section and the photo lightboxes. |
| `web/field-notes/field-note-*.md` | The Field Notes section. |
| `web/src/lib/siteConfig.ts` | Site title, subtitle, byline, the abstract, and the off-site links. |

Observations are never written into markup — a change to a bird, a place or a
count is a change to a CSV. The project's own settings are the exception, and
they live in one module rather than in a config file beside it.

## Running the site locally

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # static export into web/out/
npm run lint
```

## Updating data

Drop new eBird exports into `observation-data/`, replacing
`ebird-data-latest.csv` / `ebird-media-latest.csv`. Rebuild and the whole site
follows — the map, the location index, the species tables, and one generated
page per checklist.

## Source layout

```
web/
  field-notes/           Markdown trip reports, one file per note
  src/app/
    styles_primary.css     ALL site styling — tokens at the top, commented throughout
    styles_map.css         ALL map styling (frame, pins, MapLibre chrome)
    layout.tsx             fonts and metadata
    page.tsx               reads every content source, hands it to HomeDocument
    checklist/[id]/        one static page per submitted checklist
    design-standards/      the design reference page
  src/components/        HomeDocument, ChecklistDocument, Map, ImageLightbox
    ui/                    shared primitives: Section, Masthead, MediaGrid, Nav, Icons
  src/lib/
    parseEbird.ts          reads both eBird CSVs (server only — it touches the filesystem)
    parseFieldNotes.ts     reads field-notes/*.md
    siteConfig.ts          title, abstract, off-site links
    formatDate.ts          eBird's two date formats → one display format
```

## Design

The site shares one visual language with its sibling project, [Alexandria
Library](https://github.com/felipeharker/alexandria_script_library_master): a
quiet, modern document — Inter for headings and prose, IBM Plex Mono reserved
for recorded data, hairline rules and whitespace instead of heavy bars and
boxes, three type weights and no bold, and one deep-red accent that only ever
means "interactive or selected". Nothing on the site is numbered.

It is documented at `/design-standards` on the running site, and implemented in
two annotated stylesheets, `web/src/app/styles_primary.css` and
`web/src/app/styles_map.css`. Both open with a block of design tokens;
restyling means changing a token, not hunting through rules. There is no CSS
framework and no inline style objects.
