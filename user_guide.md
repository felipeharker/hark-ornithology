# Site Editing User Guide

A complete, non-developer-friendly reference for editing every part of the
Hark Ornithology site: what to change, which file to open, and what that
change will affect. If you only need the quick version, `usage.md` at the
repo root is a shorter cheat sheet — this guide is the exhaustive version,
covering styling, content, data, and the underlying architecture.

> **Note on `usage.md` / `web/AGENTS.md`:** those documents describe an
> earlier version of the site (with components like `Panel.tsx`,
> `Badge.tsx`, `AccordionSection.tsx`, `LocationDetailPanel.tsx`). The site
> has since been rebuilt around a single "modernist report" design system
> (numbered sections, tables, footnote-style references) implemented mostly
> in `web/src/components/HomeDocument.tsx`. This guide describes the
> **current** codebase. `web/src/components/LocationDashboard.tsx` still
> exists in the repo but is dead code — nothing imports it — so ignore it
> unless you're intentionally reviving the old accordion-style layout.

---

## 0. How the site is put together

- **Framework:** Next.js (App Router), exported as a fully static site
  (`output: 'export'` in `web/next.config.ts`). There is no server and no
  database — every page is pre-rendered from the CSV/Markdown files at
  build time.
- **Styling:** Tailwind CSS v4 utility classes for layout, plus a hand-written
  CSS "design system" (custom properties + a handful of classes like
  `.btn`, `.table`, `.tag`) in `web/src/app/globals.css` for typography,
  color, spacing, and components shared across pages.
- **Data:** eBird CSV exports in `/observation-data/`, parsed at
  request/build time by files in `web/src/lib/`. Nothing is stored in a
  database — replacing a CSV and rebuilding is the entire "content update"
  workflow for observations.
- **Content:** Markdown files in `web/field-notes/` for blog-style trip
  reports.
- **Site-wide settings:** `public/options.csv` (title, accent color, which
  data file to read).

Running it locally:

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000. Any edit to a `.tsx`/`.ts`/`.css` file
hot-reloads; edits to CSV/Markdown files require a page refresh (dev
server) or a full rebuild (`npm run build`) for production.

---

## 1. Updating observation data (the eBird CSVs)

- **Location:** `/observation-data/` (repo root, *not* inside `web/`).
- **Files that matter:** `ebird-data-latest.csv` (checklist/observation
  data — powers the map, location list, species tables, and checklist
  pages) and `ebird-media-latest.csv` (photo/audio/video metadata — powers
  the Media section and lightboxes).
- **How to update:** Export fresh data from eBird/Macaulay Library and
  overwrite these two files (or add a differently-named file and point at
  it via `data file name` in `public/options.csv`, see §5).
- **Archiving:** Old exports can be kept in `observation-data/archive/`
  for history; files there are never read by the site.
- **What it impacts:** the map pins (`Map.tsx`), the Locations table and
  its expanded checklist/species-total rows, the individual checklist
  pages (`/checklist/[id]`), and (for the media CSV) the Media section and
  photo lightboxes throughout the site.
- **Parsing code (avoid touching unless you know what you're doing):**
  `web/src/lib/parseEbirdData.ts` and `parseEbirdMediaData.ts` map the
  CSV's human-readable column headers (e.g. `"Common Name"`,
  `"Location ID"`) to the field names used everywhere else in the app
  (`CommonName`, `LocationID`, etc.), and cache the parsed result keyed on
  the file's modification time. If eBird ever changes its export column
  names, this is the file to update — but a plain data refresh never
  requires touching it.

## 2. Adding a Field Note (trip report / blog post)

- **Location:** `web/field-notes/`.
- **How to add one:** copy `web/field-notes/TEMPLATE.md` to
  `field-note-<N>.md`, where `<N>` is the next integer after the
  highest-numbered note already in the folder. Fill in the frontmatter
  (`title`, `date` required; `location`, `conditions`, `links` optional)
  and write the body as Markdown below the `---`.
- **Sorting:** notes are always listed newest-first by `<N>` — the number
  in the filename, not the `date` field. Any file that doesn't match
  `field-note-<N>.md` exactly (like `TEMPLATE.md` or `README.md`) is
  ignored.
- **Formatting:** the body supports full GitHub-flavored Markdown (bold,
  italics, links, tables, blockquotes, strikethrough, task lists) via
  `react-markdown` + `remark-gfm`.
- **What it impacts:** only the "Field Notes" section (§4) of the
  homepage — no code changes needed.
- **Parsing code:** `web/src/lib/parseFieldNotes.ts` reads the folder,
  extracts the `<N>` from the filename via regex, and parses frontmatter
  with `gray-matter`. Touch this only if you want to change what
  frontmatter fields are supported.

## 3. Site-wide options (title, accent color, data file)

- **Location:** `public/options.csv` (repo root).
- **Format:** a two-column CSV, `item,value`:

  ```csv
  item,value
  title,Harker Ornithology Report
  secondary color hex,#ff6361
  data file name,ebird-data-latest.csv
  ```

- **`title`** — the big `<h1>` on the homepage, the browser tab title, and
  the site name in the nav bar / footer link on detail pages. Wired up in
  `web/src/lib/parseOptions.ts` → consumed via `getSiteOptions()` in
  `layout.tsx` (metadata/tab title), `page.tsx` → `HomeDocument.tsx`
  (`<h1>{options.title}</h1>`), and the checklist/design-standards pages.
- **`secondary color hex`** — accepted aliases: `location color hex`,
  `link color hex` (all three map to the same setting). **Important:**
  in the *current* design system this value is largely unused — colors
  are driven almost entirely by the `--color-accent*` CSS variables in
  `globals.css` (see §6). It's only read into `SiteOptions.secondaryColorHex`,
  which is now consumed solely by the dead `LocationDashboard.tsx`
  component. To actually change the site's accent color today, edit
  `--color-accent` (and friends) in `globals.css`, not this CSV field.
- **`data file name`** — which file inside `/observation-data/` the site
  reads (default `ebird-data-latest.csv`). Change this to point the whole
  site at a differently-named export without renaming your files.
- **Parsing code:** `web/src/lib/parseOptions.ts`. It falls back to
  built-in defaults if the CSV is missing or a row is malformed, so a
  typo in `options.csv` degrades gracefully rather than breaking the
  build.

---

## 4. Editing visual style (colors, fonts, spacing, components)

Almost everything about the site's *look* — as opposed to its content —
lives in one file: **`web/src/app/globals.css`**. Layout (columns, flex vs.
grid, widths) is mostly done with inline Tailwind utility classes directly
in the `.tsx` files instead.

### 4.1 Color palette

All colors are CSS custom properties defined in `:root` at the top of
`globals.css`:

```css
--color-bg: #f3f2f2;          /* page background */
--color-surface: #eae9e9;     /* expanded-row / card background */
--color-text: #201e1d;        /* body text */
--color-accent: #ec3013;      /* the site's one accent color */
--color-accent-2: #e15b47;
--color-divider: color-mix(in srgb, #201e1d 40%, transparent);
```

Plus two 9-step ramps, `--color-neutral-100` … `900` (grays) and
`--color-accent-100` … `900` (tints/shades of the accent), used for tags,
hover states, and text-on-accent contrast.

- **To change the site's single accent color:** edit `--color-accent`
  (and ideally regenerate the `--color-accent-100`…`900` ramp to match, so
  tags/hover states stay consistent). This immediately changes: the active
  section-nav indicator, table-row selection highlight, map pin color, tag
  outlines, focus rings, link colors (`a` uses `--color-accent-700`), and
  every `.btn-primary` button.
- **To change the page background or text color:** edit `--color-bg` /
  `--color-text`. This affects literally every page, since `body` in
  `globals.css` sets `background: var(--color-bg); color: var(--color-text)`.
- **Dividers:** every horizontal rule and border on the site (section
  breaks, table rows, the nav bottom border) uses `--color-divider`, so
  one edit here changes all rule/border colors uniformly.

### 4.2 Fonts

Two font families, loaded via `next/font/google` in
`web/src/app/layout.tsx`:

```ts
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "600", "800"], variable: '--font-archivo' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: '--font-roboto-mono' });
```

These are then mapped to semantic variables in `globals.css`:

```css
--font-heading: var(--font-archivo), system-ui, sans-serif;
--font-body: var(--font-archivo), system-ui, sans-serif;
--font-mono: var(--font-roboto-mono), ui-monospace, monospace;
```

- **To swap a font:** change the import + `weight` array in
  `layout.tsx`, and update the matching `--font-*` variable in
  `globals.css`. Archivo carries every heading and all body prose;
  Roboto Mono is used specifically for *data* — dates, times, counts,
  coordinates, scientific names, captions, and section numerals — so a
  reader can distinguish recorded values from written sentences at a
  glance. Keep that distinction in mind if you swap fonts.
- **Heading sizes:** `h1`–`h6` rules in `globals.css` (`h1 { font-size: 42px; }`,
  etc.) apply site-wide to every heading tag, since almost no component
  overrides them.

### 4.3 Spacing, radius, and rule weights

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-6: 24px; --space-8: 32px;
--radius-sm/md/lg: 0px;   /* the whole site is currently square-cornered */
```

Every margin/padding/gap in the codebase is written as `var(--space-N)`
rather than a bare pixel value — editing one of these tokens changes that
spacing everywhere it's used, all at once. Two rule weights carry all
visual structure: a 2px divider between major sections (and around the
masthead/footer), and a 1px divider between rows within a section. This
convention is documented (and rendered live) on the site's own
**Design Standards** page at `web/src/app/design-standards/page.tsx`
(linked from the homepage's Reference section) — check that page after any
spacing/color change to see the effect summarized in one place, and update
its `TYPE_ROWS` / `swatches` arrays if you actually change the scale.

### 4.4 Shared style classes

Also defined in `globals.css`, used via `className` throughout the `.tsx`
files:

| Class | What it styles | Where it shows up |
|---|---|---|
| `.hk-label` | small uppercase mono eyebrow text | "Abstract", "Selected", "Checklists", "Species Observed" labels |
| `.hk-figcap` | small muted mono caption text | figure/table captions under the map, media grids, tables |
| `.btn`, `.btn-primary`, `.btn-secondary` | buttons | "Return to Homepage", "View Media"/"View List" toggle, GitHub button in `Nav` |
| `.field`, `.input` | form fields | the location filter search box |
| `.tag`, `.tag-accent`, `.tag-neutral`, `.tag-outline` | small pill labels | breeding-code tags on checklist pages, "Incomplete" status tag |
| `.nav`, `.nav-brand` | top nav bar | `Nav.tsx`, used on checklist & design-standards pages (not the homepage, which uses a sticky sidebar instead) |
| `.table` | data tables | Locations table, species tables, checklist species table, type-scale table |
| `.hr` | horizontal rule | rarely used directly; most section breaks use inline `borderTop` styles instead |

Editing one of these updates every instance across the whole site at
once — convenient, but test on more than one page after changing it.

### 4.5 Layout (columns, widths, responsiveness)

Layout is handled with Tailwind utility classes written directly in
JSX `className` props (not in `globals.css`). Look for classes like
`flex`, `flex-col`, `md:flex-row`, `grid`, `grid-cols-2`,
`md:grid-cols-3`, `max-w-[720px]`, `w-full`. The overall page shell — a
sticky 160px section-nav sidebar plus a 720px-wide content column, capped
at a 1000px max width — is set in `HomeDocument.tsx`:

```tsx
<div className="flex gap-8 max-w-[1000px] mx-auto px-4 items-start">
  <aside className="hidden md:block w-[160px] shrink-0 sticky top-6 pt-8"> ... </aside>
  <main className="max-w-[720px] flex-1 min-w-0" ...> ... </main>
</div>
```

Changing `max-w-[720px]` widens/narrows every page's content column (the
same pattern is repeated with an inline `style` in the checklist and
design-standards pages, so update those too for consistency). Changing
`grid-cols-N` in a media grid changes how many photo thumbnails fit per
row at that breakpoint.

---

## 5. Editing the homepage's content and structure

**Location:** `web/src/components/HomeDocument.tsx` (447 lines) — this is
the single component that renders the entire homepage. It's a "modernist
report" layout: a sticky numbered-section sidebar, an Abstract intro, then
five numbered sections that never collapse (except one exception, see
below).

- **`SECTIONS` constant (top of file):** the five sidebar entries — Map,
  Locations, Media, Field Notes, Reference. Add/remove/reorder entries
  here *and* add/remove the matching `<section id="sec-...">` block
  further down to keep the sidebar and page content in sync.
- **`ABOUT_LINKS` constant:** the numbered `[1]`, `[2]`, … external links
  in the "Reference" section (GitHub repo, Design Standards page, eBird
  account, Macaulay Library, Merlin Bird ID). Edit `label`, `href`, or
  `desc` on any entry to change that link's text/URL/description, or add
  a new object to the array to add another reference.
- **The masthead / Abstract paragraph:** the `<header>` block near the top
  — edit the hard-coded byline text (`"Felipe Harker · Observer"`) or the
  paragraph under "Abstract" directly in the JSX to change the homepage's
  intro copy.
- **Section 1 (Map):** renders `<MapView>` (see §7) plus, if a location is
  selected, a small "Selected" summary card linking down to the Locations
  table.
- **Section 2 (Locations):** the filterable table of every distinct
  location. This *is* the one exception to "sections never collapse" — a
  table row, when clicked, expands inline to show that location's
  checklists and species totals (computed in the `selectedChecklists` /
  `selectedSpecies` `useMemo` blocks). To change what's shown in an
  expanded row, edit the `<tr>` block starting at `{isSelected && (...)}`.
- **Section 3 (Media):** groups all photo/video/audio by checklist and
  renders them via `<MediaGrid>` (see §7), grouped under each checklist's
  location/date header, with a link to that checklist's report.
- **Section 4 (Field Notes):** renders each parsed `FieldNote` (see §2),
  including its metadata (date/location/conditions/links) and Markdown
  body via `<ReactMarkdown>`.
- **Section 5 (Reference):** renders `ABOUT_LINKS` as a numbered
  bibliography-style list.
- **Footer:** the "Data current as of …" line — pulled from the newest
  checklist date in the dataset (`latestChecklist`, computed via
  `useMemo`), not hand-edited.

**What NOT to touch casually:** the `useMemo`/`useState`/`useEffect`
blocks (`locations`, `filteredLocations`, `selectedSpecies`, `mediaGroups`,
etc.) compute all the derived data (totals, groupings, sort order) for the
page. Changing their *logic* can silently corrupt what's displayed;
changing surrounding JSX/styling is safe.

## 6. Editing individual pages

### 6.1 Checklist report pages (`/checklist/[id]`)

- **Route file:** `web/src/app/checklist/[id]/page.tsx` — the page shell
  (nav, back link, header metadata block: location, date/time, protocol,
  effort, observers, incomplete-checklist tag, comments).
- **Species table:** `web/src/components/ChecklistDocument.tsx` — the
  actual species/count table for that checklist, plus a "View Media" /
  "View List" toggle button if the checklist has associated photos.
- **What it impacts:** editing `page.tsx` changes every checklist page's
  header layout; editing `ChecklistDocument.tsx` changes every checklist
  page's species list/media view.

### 6.2 Design Standards page (`/design-standards`)

- **Location:** `web/src/app/design-standards/page.tsx`. A self-contained
  reference page documenting the site's own type scale, spacing/rule
  conventions, and color palette (with live swatches pulled from the same
  CSS variables described in §4.1). If you change fonts, spacing, or
  colors in `globals.css`, update the `TYPE_ROWS` and `swatches` arrays
  here so the documentation stays accurate — this page doesn't
  auto-detect changes elsewhere.

### 6.3 Root layout (applies to every page)

- **Location:** `web/src/app/layout.tsx`. Sets the `<html>`/`<body>` shell,
  loads the two Google Fonts, and generates the page `<title>` /
  `<meta description>` / Open Graph / Twitter card tags from
  `options.title` (see §3). Editing the hard-coded `description` string
  here changes the meta description and social-share preview text for
  every page on the site.

---

## 7. Shared components (used across multiple pages)

Changing any of these changes *every* place it's used — check more than
one page after editing.

| Component | File | Used on | What it renders |
|---|---|---|---|
| `Nav` | `web/src/components/ui/Nav.tsx` | Checklist pages, Design Standards page (not the homepage) | Top bar: site title link + GitHub button |
| `MapView` | `web/src/components/Map.tsx` | Homepage (Section 1) | The `react-map-gl`/MapLibre map, its markers, and fly-to-selection behavior |
| `MediaGrid` | `web/src/components/ui/MediaGrid.tsx` | Homepage Media section, Checklist media view | Responsive thumbnail grid with figure captions |
| `ImageLightbox` | `web/src/components/ImageLightbox.tsx` | Homepage, Checklist pages | Full-screen photo/video viewer with prev/next/close and keyboard nav |
| `Icons` | `web/src/components/ui/Icons.tsx` | Nav, buttons, map pins, lightbox | All inline SVG icons (search, map pin, arrows, close, etc.) |

### 7.1 The map (`Map.tsx`)

- **Base map style:** set via the `mapStyle` prop on `<Map>` — currently
  `"https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"` (a
  Carto "Positron" light basemap). Swap this URL for a different MapLibre
  style to change the map's look.
- **Markers:** `MapPinIcon` from `Icons.tsx`, colored via
  `--color-accent` when unselected and `--color-text` (plus a scale-up)
  when selected.
- **Do not touch casually:** the `flyTo` camera-panning `useEffect` and
  the marker-positioning logic (`locationGroups` grouping by
  `LocationID`/coordinates) — these control the map's core interactive
  behavior and are easy to break with a small edit.

### 7.2 Media grid & lightbox

- Both pull images directly from the Macaulay Library CDN using each
  item's `MLCatalogNumber`:
  `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/{id}/1200`.
  There's no local image storage — as long as the CSV has a valid catalog
  number, the image renders automatically.
- **Figure numbering:** `MediaGrid` accepts a `figOffset` prop so
  captions ("Fig. 1", "Fig. 2", …) can continue counting across multiple
  groups on the same page (used on the homepage, where each
  checklist/location gets its own grid but numbering runs continuously).

---

## 8. Data flow reference (how a CSV/Markdown edit becomes a page)

```
observation-data/ebird-data-latest.csv
   → web/src/lib/parseEbirdData.ts (getLatestEbirdData)
      → web/src/app/page.tsx  (fetches once per request)
         → HomeDocument.tsx   (map, locations, species tables)
      → web/src/app/checklist/[id]/page.tsx
         → ChecklistDocument.tsx (per-checklist species table)

observation-data/ebird-media-latest.csv
   → parseEbirdMediaData.ts (getLatestEbirdMediaData)
      → HomeDocument.tsx (Media section) / ChecklistDocument.tsx (media view)

web/field-notes/field-note-N.md
   → parseFieldNotes.ts (getFieldNotes)
      → HomeDocument.tsx (Field Notes section)

public/options.csv
   → parseOptions.ts (getSiteOptions)
      → layout.tsx (title/meta), HomeDocument.tsx (title), Nav.tsx, checklist & design-standards pages
```

Every `lib/*.ts` file caches its parsed result keyed on the source file's
modification time (`mtime`), so edits are always picked up on the next
request/build — there's no manual cache-clearing step.

---

## 9. Critical areas — don't edit unless you know what you're doing

1. **Data parsing (`web/src/lib/parseEbirdData.ts`, `parseEbirdMediaData.ts`,
   `parseOptions.ts`, `parseFieldNotes.ts`):** these map raw CSV columns
   and Markdown frontmatter to the field names the rest of the app
   depends on, and manage caching. Changing field-name mappings or the
   `mtime` cache check can silently break data loading site-wide.
2. **`useMemo`/`useState`/`useEffect` blocks** inside any `.tsx` file:
   these compute derived data (totals, sort order, groupings, map
   camera behavior, section-scroll tracking). Editing their logic can
   corrupt what's displayed even if the page still "looks" fine at
   first glance.
3. **Map camera/marker logic in `Map.tsx`** — the `flyTo` panning effect
   and marker positioning by `LocationID`/coordinates.
4. **Build/config files:** `web/next.config.ts` (must keep
   `output: 'export'` for static hosting to work — see §10),
   `web/package.json`, `web/tsconfig.json`. Changes here can prevent the
   site from building at all.
5. **`web/src/components/LocationDashboard.tsx`** is unused dead code
   (verified: nothing imports it). It's safe to ignore or delete, but
   don't assume editing it changes anything on the live site.

---

## 10. Hosting / deployment

The site builds to a fully static export (`web/out/`) — no server
required. `web/build.sh` runs `npm install && npm run build`. Any static
host works; for Render specifically:

1. Push the repo (including `observation-data/`) to GitHub.
2. Render → New → Static Site → select the repo.
3. Build command: `cd web && npm install && npm run build`
4. Publish directory: `web/out`

Pushing a new CSV or Markdown file to the repo and letting the host
rebuild is the entire "publish new content" workflow — there is no admin
panel or CMS.
