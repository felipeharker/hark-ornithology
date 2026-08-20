# Editor Contribution Guide

Welcome to the contribution and editing guide for the Hark Ornithology Report! This document is designed specifically for content editors who need to update the application's data or tweak its visual interface, without needing a deep background in programming.

This guide will explain exactly where different visual components live, how to update the core data, and what critical systems should be left alone to prevent breaking the application.

---

## 1. Updating the Observation Data

The entire application runs off CSV files downloaded from eBird.

*   **Location:** `/observation-data/` (Root level directory)
*   **How to edit:** Replace `ebird-data-latest.csv` and `ebird-media-latest.csv` with fresh exports (or point at a different file via `data file name` in `public/options.csv` - see section 4).
*   **Note:** The site always reads exactly the one file named `data file name` (default `ebird-data-latest.csv`), not every CSV in the folder. Older exports can be kept in `observation-data/archive/` for history without affecting the live site.

## 2. Editing Visual Elements

The frontend is built with React and Next.js, and uses Tailwind CSS for styling. If you want to change colors, fonts, or basic layout elements, you will be modifying class names (like `text-black`, `bg-white`, `font-bold`).

### Shared building blocks
*   **Location:** `web/src/components/ui/`
*   **What's there:** Small reusable pieces used all over the site - `Panel` (the bordered white card), `SectionHeading`, `Badge` (small tags like "Breeding Code" or "Incomplete"), `EmptyState` (the "nothing to show" boxes), `AccordionSection` (the ▶/▼ toggle sections on the homepage), `MediaGrid`/`MediaThumbnail` (photo grids), and `Icons.tsx` (the small line-art icons).
*   **Why it matters:** Editing one of these changes it everywhere it's used. For example, changing the border color in `Panel.tsx` updates every bordered card across the whole site at once - which is convenient, but means a small edit here has a wide effect. Test on a page-by-page basis after editing.

### Headers & Main Titles
*   **Location:** `web/src/app/page.tsx`
*   **What to look for:** Look for standard HTML heading tags like `<h1>`.
*   **Example:** The big title (from `options.title`, see section 4), "Latest Checklist," and "Life List" lines all live here.

### Buttons & Interactive Links
*   **Locations:** `web/src/components/ui/AccordionSection.tsx` (the Map/Lists/Media/Notes/About toggles), `web/src/components/LocationDashboard.tsx` (the location and field-note select buttons), and `web/src/components/Map.tsx` (the map pin markers).
*   **What to look for:** Search for `<button>` elements. Hover/selected states are plain Tailwind classes (e.g. `hover:bg-black`, `bg-black text-white`) you can adjust directly.

### Charts & Graphs (Data Visualization)
*   **Location:** The `<LineChart>` itself lives in `web/src/components/LocationDetailPanel.tsx` (shared by both the Map and Lists tabs). Its color palette, `CHART_COLORS`, is defined in `web/src/components/LocationDashboard.tsx` and passed down.
*   **How to edit:**
    *   **Colors:** `CHART_COLORS = ['#003f5c', secondaryColor, '#bc5090', '#ffa600', '#58508d']` in `LocationDashboard.tsx`. `secondaryColor` is your configured accent color (section 4) so it doesn't need editing here; the chart line itself uses the first entry, `#003f5c`.
    *   **Labels/Titles:** Edit the text passed to `<SectionHeading>` just above the chart (e.g. "Observations over Time (Month/Year)").
    *   **Axes:** Modify properties on the `<XAxis>` and `<YAxis>` tags in `LocationDetailPanel.tsx`.

### The Primary Map
*   **Location:** `web/src/components/Map.tsx`
*   **What to look for:** The `<Map>` component (using `react-map-gl/maplibre`) and the `<Marker>` pins.
*   **How to edit:**
    *   **Base Style:** The map's background style URL is set in the `mapStyle` property (currently a Carto positron map).
    *   **Markers:** The pin icon is `MapPinIcon` in `web/src/components/ui/Icons.tsx`; its color comes from the `--accent` CSS variable (section 4) when unselected, and switches to black when selected.

### Layouts, Sections, & Columns
*   **Locations:** Across `page.tsx`, `LocationDashboard.tsx`, `LocationDetailPanel.tsx`, and `Map.tsx`.
*   **What to look for:** `<div>` elements with Tailwind classes like `flex`, `flex-col`, `md:flex-row`, `w-full`.
*   **How to edit:** The application uses flexbox/grid to manage columns. Changing a class like `grid-cols-2` or `md:w-72` will alter the column ratios.

### Field Notes (blog posts)
*   **Location:** `web/field-notes/`
*   **How to edit:** See `web/field-notes/README.md` and copy `web/field-notes/TEMPLATE.md` to start a new post. No code changes needed.

---

## 🚫 WARNING: Critical Areas (Do Not Tinker)

To avoid breaking the application's functionality, please **do not** touch the following areas unless you are an experienced developer and have a clear understanding of the core logic:

1.  **Data Parsing Logic (`web/src/lib/parseEbirdData.ts`, `parseEbirdMediaData.ts`, `parseOptions.ts`, `parseFieldNotes.ts`):** These files read and cache the CSV/Markdown files. Changing the parsing loops, field-name mappings, or caching (the `mtime` checks) will break the dashboard's ability to read your data.
2.  **`useMemo` and `useState` Hooks:** Inside any `.tsx` file, blocks of logic wrapped in `useMemo(...)` or `useState(...)` calculate the data for the graphs, maps, and UI state (sorting, filtering, totals). Editing the logic inside these blocks can corrupt the data displayed.
3.  **Map Coordinate Logic (`Map.tsx`):** Do not alter the `flyTo` camera panning logic or the marker positioning.
4.  **Core Configuration Files:** Files like `next.config.ts`, `package.json`, and `tsconfig.json` handle the build environment. Modifying these can prevent the site from compiling entirely.

## 3. Hosting on Render

This application is built as a static Next.js site, making it incredibly easy and free to host on a platform like [Render](https://render.com/).

### Steps to Host:
1. **Create a GitHub Repository**: Upload this entire project folder (including your data in `observation-data`) to a repository on your GitHub account.
2. **Sign up for Render**: Go to Render.com and connect your GitHub account.
3. **Create a New Static Site**:
   - In the Render dashboard, click "New" and select **Static Site**.
   - Select your newly created repository from the list.
4. **Configure the Build Settings**:
   - **Name**: Choose any name for your site (e.g., `my-ornithology-report`).
   - **Branch**: `main` (or whatever your default branch is).
   - **Root Directory**: Leave blank.
   - **Build Command**: `cd web && npm install && npm run build`
   - **Publish Directory**: `web/out`
5. **Deploy**: Click **Create Static Site**. Render will now automatically build and publish your site online!

Whenever you add new `.csv` data files to your repository, Render will automatically detect the changes and rebuild your site with the latest data.

## 4. Customizing Your Site Options

You can easily customize various aspects of the site (like the title, primary data file, and colors) without touching any code.

All you need to do is edit the `options.csv` file located at the root directory of the project: `public/options.csv`.

### Example `public/options.csv` file:
```csv
item,value
title,Harker Ornithology Report
secondary color hex,#ff6361
data file name,ebird-data-latest.csv
```

### Available Options:
*   **`title`**: The main title displayed at the top of the dashboard and in the browser tab.
*   **`secondary color hex`**: A hex color code (e.g., `#ff6361`) that defines the accent color across the site. It's applied once, as the `--accent` CSS variable on `<body>` in `web/src/app/layout.tsx`, and used everywhere via Tailwind's `text-[var(--accent)]` (unselected map markers, location/note list items, links, and chart accents).
*   **`data file name`**: The specific filename (e.g., `ebird-data-latest.csv`) inside the `observation-data/` folder that the site should read.
