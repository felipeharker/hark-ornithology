# `web/` — the site

A Next.js app exported as a fully static site. There is no server and no
database: every page is pre-rendered at build time from the CSV and Markdown
files in this repository.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export into out/
npm run lint
```

## What builds each part of the page

| Source file | What it produces |
|---|---|
| `../observation-data/ebird-data-latest.csv` | Map pins, the location index, species tables, and one page per checklist. |
| `../observation-data/ebird-media-latest.csv` | The Media section and the photo lightboxes. |
| `content/abstract.md` | The abstract under the title on the homepage. |
| `field-notes/field-note-*.md` | The Field Notes section. |
| `../public/options.csv` | Site title, accent color, and which observation CSV to read. |

Nothing on the site is hardcoded content — changing any file above and
rebuilding is the entire update workflow.

## Layout

```
content/            prose files (abstract)
field-notes/        Markdown trip reports, one file per note
src/app/
  styles_primary.css   ALL site styling — tokens at the top, commented throughout
  styles_map.css       ALL map styling (frame, pins, MapLibre chrome)
  layout.tsx           fonts, metadata, accent color
  page.tsx             reads every content source, hands it to HomeDocument
  checklist/[id]/      one static page per submitted checklist
  design-standards/    the design reference page
src/components/     HomeDocument, ChecklistDocument, Map, ImageLightbox, ui/
src/lib/            one parser per content source
```

## Styling

Plain CSS, no framework. Two stylesheets, both imported in `src/app/layout.tsx`:

- **`src/app/styles_primary.css`** — everything except the map. It opens with a
  block of design tokens (color, type, spacing, measure) and is organised into
  19 numbered, commented sections. Restyling the site means changing a token,
  not hunting through rules.
- **`src/app/styles_map.css`** — the map frame, the pins, and MapLibre's own
  controls. Its header explains which parts of a MapLibre map are CSS and which
  are not (the basemap itself is a JSON style document, selected by URL in
  `src/components/Map.tsx`).

Components carry class names only; there are no inline style objects apart from
one data-driven color swatch on the design-standards page.

The design language is shared with [Alexandria
Library](https://github.com/felipeharker/alexandria_script_library_master) —
see `/design-standards` on the running site.
