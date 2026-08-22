# Site Editing User Guide

A complete reference for editing every part of the Hark Ornithology site: what
to change, which file to open, and what that change affects. Written for
editing content and styling, not for developing features.

---

## 0. How the site is put together

- **Framework:** Next.js (App Router), exported as a fully static site
  (`output: 'export'` in `web/next.config.ts`). There is no server and no
  database — every page is pre-rendered from files at build time.
- **Styling:** plain CSS, no framework. Two annotated stylesheets:
  `web/src/app/styles_primary.css` (everything) and
  `web/src/app/styles_map.css` (the map). Both open with a block of design
  tokens.
- **Content:** eBird CSV exports, plus Markdown files for the abstract and the
  field notes.
- **Settings:** `public/options.csv` — title, accent color, data file name.

Running it locally:

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000. Edits to `.tsx`/`.css` hot-reload; edits to
CSV/Markdown need a page refresh in dev, or a rebuild for production.

### The whole content pipeline at a glance

| Want to change | Edit this |
|---|---|
| The observations, locations, species, checklists | `observation-data/ebird-data-latest.csv` |
| The photos | `observation-data/ebird-media-latest.csv` |
| The abstract paragraphs | `web/content/abstract.md` |
| A field note | `web/field-notes/field-note-<N>.md` |
| Site title, accent color, data file | `public/options.csv` |
| Any color, font, size, or spacing | `web/src/app/styles_primary.css` |
| Anything about the map's appearance | `web/src/app/styles_map.css` |
| Section names/order, reference links | `web/src/components/HomeDocument.tsx` |

---

## 1. Updating observation data (the eBird CSVs)

- **Location:** `observation-data/` (repo root, *not* inside `web/`).
- **Files:** `ebird-data-latest.csv` (observations — powers the map, the
  location index, species tables, and checklist pages) and
  `ebird-media-latest.csv` (photo metadata — powers the Media section and the
  lightboxes).
- **How to update:** export fresh data from eBird / the Macaulay Library and
  overwrite these two files. To keep a differently-named file instead, point at
  it via `data file name` in `public/options.csv` (§5).
- **Archiving:** old exports can sit in `observation-data/archive/`; files there
  are never read.
- **Parsing code:** `web/src/lib/parseEbirdData.ts` and
  `parseEbirdMediaData.ts` map eBird's column headers (`"Common Name"`,
  `"Location ID"`) to the field names used throughout the app (`CommonName`,
  `LocationID`), and cache the result keyed on the file's modification time. A
  plain data refresh never requires touching them; only a change to eBird's
  export format does.

## 2. Editing the abstract

- **File:** `web/content/abstract.md`.
- **How:** plain Markdown. Blank lines separate paragraphs; `*italic*`,
  `**bold**`, and `[links](https://example.com)` all work. Save and refresh.
- **What it affects:** the paragraphs under the title on the homepage, nothing
  else. Delete the file entirely and the abstract block simply doesn't render.
- **The Keywords line** below the abstract is not in that file — it is markup in
  `web/src/components/HomeDocument.tsx`, in the abstract block.

## 3. Adding a field note

- **Location:** `web/field-notes/`.
- **How:** copy `TEMPLATE.md` to `field-note-<N>.md`, where `<N>` is the next
  integer after the highest-numbered note. Fill in the frontmatter (`title` and
  `date` required; `location`, `conditions`, `links` optional) and write the
  body as Markdown below the `---`.
- **Sorting:** newest first by `<N>` — the number in the filename, not the
  `date` field. Any file that doesn't match `field-note-<N>.md` exactly (like
  `TEMPLATE.md` or `README.md`) is ignored.
- **Formatting:** full GitHub-flavored Markdown. How the rendered output looks
  is set by the `.note-body` rules in §13 of `styles_primary.css`.
- **Parsing code:** `web/src/lib/parseFieldNotes.ts`.

## 4. Editing styles

Everything visual is in two files. Neither has a build step — save and refresh.

### `web/src/app/styles_primary.css`

Section 1 of the file is a block of **design tokens** — every color, font,
type size, and spacing step the site uses. Nearly every rule below is written in
terms of them, so changing a token restyles the whole site consistently:

| Token group | Controls |
|---|---|
| `--color-bg`, `--color-surface` | Page background; the tint behind an expanded location row. |
| `--color-text`, `--color-text-soft`, `--color-text-mute` | Body copy, secondary prose, captions and labels. |
| `--color-accent` | Links, map pins, the selected location row, disclosure hints. Usually set from `options.csv` instead — see §5. |
| `--color-rule-strong`, `--color-rule` | The two divider tints. Both are 1px hairlines; they differ in contrast, not thickness. |
| `--font-body`, `--font-mono` | The sans and monospace faces. To change a family, edit the `next/font` imports in `web/src/app/layout.tsx` too. |
| `--weight-regular`, `--weight-medium`, `--weight-strong` | 400 / 500 / 600. Nothing on the site is set bolder than 600. |
| `--size-*` | The type scale: title, section, body, table, data, caption, label. |
| `--track-*` | Letter-spacing: tight for headings, slightly tight for prose, open for uppercase labels. |
| `--space-1` … `--space-7` | Every margin, padding, and gap. |
| `--radius-sm`, `--radius-md` | Corner rounding on controls and panels. Text and tables stay square. |
| `--measure`, `--measure-text` | Page width, and the width running prose is allowed to reach. |

The rest of the file is 19 numbered, commented sections — masthead, abstract,
table of contents, tables, the location index, collapsible sections, media,
field notes, references, checklist pages, and so on. The header comment lists
them all. (The stylesheet's own sections are numbered so you can find a rule;
nothing the *reader* sees on the site is numbered.)

**Rule of thumb:** if you're about to write a pixel value or a hex color into a
rule, check whether a token already exists for it.

### `web/src/app/styles_map.css`

The map's frame, its pins, and MapLibre's own controls. Its tokens cover map
height, pin size, and pin colors (which default to the site accent).

**One important limit,** explained at the top of that file: a MapLibre map has
two layers of appearance and only one of them is CSS. The **basemap** — roads,
water, land color, labels — is a MapLibre *Style JSON* document served by the
tile provider, selected by URL in the `BASEMAP_STYLE_URL` constant in
`web/src/components/Map.tsx`. To change how the basemap itself looks, point
that constant at a different style URL. Everything drawn *on top* of the
basemap is ordinary HTML, and that is what `styles_map.css` controls.

## 5. Site options

Edit `public/options.csv`:

```csv
item,value
title,Harker Ornithology Report
accent color hex,#7c1405
data file name,ebird-data-latest.csv
```

- **`title`** — the masthead heading, the browser tab, and the brand in the nav
  bar on interior pages.
- **`accent color hex`** — applied once, as a `--color-accent` override on
  `<body>` in `web/src/app/layout.tsx`. Every accent on the site follows,
  including the hover shade, which is derived from it. (The older spellings
  `secondary color hex`, `location color hex`, and `link color hex` still work.)
- **`data file name`** — which CSV in `observation-data/` to read.

## 6. Page structure and section names

**File:** `web/src/components/HomeDocument.tsx`.

- **`SECTIONS`** at the top of the file drives the table of contents. Reorder or
  rename entries here and the index follows. The `id` of each entry must match
  the `id` passed to its `<Section>` further down.
- **`REFERENCES`** is the link list in the Reference section — label, href, and
  description per entry. It is a plain list: no numbering, and nothing in the
  prose above points at it with a superscript marker.
- **The masthead** (eyebrow, title, subtitle, byline, dateline) is the shared
  `<Masthead>` component near the top of the returned JSX. The title comes from
  `options.csv`; the dateline is computed from the most recent date in the
  observation data.
- **Section blocks** come from `web/src/components/ui/Section.tsx` —
  `<Section>` for a plain block, `<DisclosureSection>` for one that collapses,
  `<Disclosure>` for a collapsible subsection. Use these rather than writing the
  heading markup by hand, so every page stays consistent.
- **Off-site URLs** (the repository, the eBird profile, Macaulay, Merlin) live
  in `web/src/lib/siteLinks.ts`, so each is written once.

## 7. Collapsible sections

Both use the browser's native `<details>`/`<summary>` element — there is no
JavaScript behind opening and closing them.

- **Locations (section 2)** collapses as a whole, and starts **closed** so the
  page opens short. It opens automatically when you arrive at a
  `?locationId=…` URL or click a pin on the map. That one behavior is the
  reason its open state is tracked in React (`locationsOpen`) rather than left
  entirely to the browser.
- **Media (section 3)** stays open, but **each checklist's photos** is its own
  collapsed subsection, so the section reads as an index of checklists until you
  open one.

To change a default, set or remove `open` on the relevant `<details>`. The
"Show N photos" / "Hide" labels are both present in the markup; CSS decides
which is visible (`.disclosure-hint` in §10 of `styles_primary.css`).

## 8. Checklist pages

**File:** `web/src/app/checklist/[id]/page.tsx`, with the species table in
`web/src/components/ChecklistDocument.tsx`.

One static page is generated per submission ID found in the observation CSV.
The masthead shows the location, place, date and time; the `record` list below
it shows protocol, effort, observers, and any checklist comments — rows with no
data are omitted rather than rendered empty. A checklist with photos gets a
"View Media" toggle.

## 9. Media and the lightbox

- **Grid:** `web/src/components/ui/MediaGrid.tsx`. Thumbnail size and columns
  come from `.media-grid` in §12 of `styles_primary.css`.
- **Images** are loaded directly from the Macaulay Library CDN by catalog
  number — there are no image files in this repository. The URL is built by
  `mediaAssetUrl()` in `MediaGrid.tsx`.
- **Lightbox:** `web/src/components/ImageLightbox.tsx`. Escape closes it; arrow
  keys page through the set.

## 10. Design standards page

`/design-standards`, from `web/src/app/design-standards/page.tsx`. It documents
the type scale, color, rule weights, and document conventions the site follows —
which are shared with the Alexandria Library site. If you change a token in
`styles_primary.css`, update the corresponding row there; nothing keeps them in
sync automatically.

---

## Areas to leave alone unless you know the code

1. **The parsers** (`web/src/lib/parse*.ts`) — they read and cache the CSV and
   Markdown files. Changing the field-name mappings or the `mtime` caching
   breaks the site's ability to read your data.
2. **`useMemo` / `useState` blocks** in the components — these compute the
   location counts, species totals, and media grouping. Editing the logic inside
   them corrupts what's displayed.
3. **Map camera logic** in `Map.tsx` — the `flyTo` calls and marker positioning.
4. **Build configuration** — `next.config.ts`, `package.json`, `tsconfig.json`.

## Deploying

The site builds to a static folder, so any static host works. On
[Render](https://render.com/):

1. Push this repository to GitHub.
2. Create a new **Static Site** and select the repository.
3. **Build Command:** `cd web && npm install && npm run build`
4. **Publish Directory:** `web/out`

New commits — including new CSV data — trigger a rebuild automatically.
