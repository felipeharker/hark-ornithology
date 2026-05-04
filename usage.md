# Editor Contribution Guide

Welcome to the contribution and editing guide for the Hark Ornithology Report! This document is designed specifically for content editors who need to update the application's data or tweak its visual interface, without needing a deep background in programming.

This guide will explain exactly where different visual components live, how to update the core data, and what critical systems should be left alone to prevent breaking the application.

---

## 1. Updating the Observation Data

The entire application runs off CSV files downloaded from eBird.

*   **Location:** `/observation-data/` (Root level directory)
*   **How to edit:** To add new observations, simply drop your new `.csv` files into the `observation-data` directory. The application is programmed to automatically detect and parse any valid CSV files placed in this folder.
*   **Note:** If you want to *remove* data, simply delete the old `.csv` files from this folder. The application processes all files in the directory together.

---

## 2. Editing Visual Elements

The frontend is built with React and Next.js, and uses Tailwind CSS for styling. If you want to change colors, fonts, or basic layout elements, you will be modifying class names (like `text-black`, `bg-white`, `font-bold`).

### Headers & Main Titles
*   **Location:** `web/src/app/page.tsx`
*   **What to look for:** Look for standard HTML heading tags like `<h1>` and `<h2>`.
*   **Example:** If you want to change "Ornithological Report" or "Fig. 1: Observation Data and Distribution", you can find those strings directly in `page.tsx` and alter the text or their styling classes.

### Buttons & Interactive Links
*   **Locations:** `web/src/components/LocationDashboard.tsx` and `web/src/components/Map.tsx`
*   **What to look for:** Search for `<button>` elements.
*   **Example:** In `LocationDashboard.tsx`, the primary "All Locations / View Map" button and the buttons for the location list reside here. You can adjust hover states (e.g., `hover:bg-black`, `hover:text-white`) or borders directly on these elements. In `Map.tsx`, you'll find the buttons that toggle the "Locations" and "Heatmap" views.

### Charts & Graphs (Data Visualization)
*   **Location:** `web/src/components/LocationDashboard.tsx`
*   **What to look for:** Look for the `<LineChart>` and `<PieChart>` components (provided by the `recharts` library).
*   **How to edit:**
    *   **Colors:** There is a specific constant `CHART_COLORS = ['#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600']` defined near the top of the file. Changing these hexadecimal codes will update the color palette for the graphs.
    *   **Labels/Titles:** You can edit the text inside the `<h3>` tags just above the charts (e.g., "Observations over Time (Month/Year)").
    *   **Axes:** You can modify basic properties inside the `<XAxis>` and `<YAxis>` tags.

### The Primary Map
*   **Location:** `web/src/components/Map.tsx`
*   **What to look for:** The main `<Map>` component (using `react-map-gl/maplibre`).
*   **How to edit:**
    *   **Base Style:** The map's background style URL is set in the `mapStyle` property (currently a Carto positron map).
    *   **Heatmap Styling:** Inside the `<Layer id="heatmap-layer">` component, you can find a property called `'heatmap-color'`. This array defines the color gradient of the heatmap, which matches the charts.
    *   **Markers:** Look for the `<Marker>` component. The SVG inside determines the icon shape.
*   *(Note: There is also a static mini-map outline component located at `web/src/components/WorldMapGraphic.tsx` used as an abstract visual in the dashboard).*

### Layouts, Sections, & Columns
*   **Locations:** Across `page.tsx`, `LocationDashboard.tsx`, and `Map.tsx`.
*   **What to look for:** Look for `<div>` elements with Tailwind classes like `flex`, `flex-col`, `md:flex-row`, `w-full`, and `lg:w-2/3`.
*   **How to edit:** The application uses flexbox to manage columns. Changing a class like `w-full` (100% width on mobile) or `md:w-72` (fixed width on desktop) will alter the column ratios.

---

## 🚫 WARNING: Critical Areas (Do Not Tinker)

To avoid breaking the application's functionality, please **do not** touch the following areas unless you are an experienced developer and have a clear understanding of the core logic:

1.  **Data Parsing Logic (`web/src/lib/parseEbirdData.ts`):** This file contains complex, highly-optimized caching logic that reads the CSV files. Changing the parsing loops or how memory is allocated will break the dashboard's ability to read your data.
2.  **`useMemo` and `useState` Hooks:** Inside any `.tsx` file, you will see blocks of logic wrapped in `useMemo(...)` or `useState(...)`. These calculate the data for the graphs, maps, and UI state (like sorting monthly totals or pseudo-random color assignments). Editing the logic inside these blocks can corrupt the data displayed.
3.  **Map Coordinate Logic (`Map.tsx`):** Do not alter the bounding box math, the `heatmapGeoJSON` object generator, or the `useEffect` blocks that trigger the `flyTo` camera panning animations.
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
title,Hark Ornithology Report
secondary color hex,#58508d
data file name,ebird-data-latest.csv
```

### Available Options:
*   **`title`**: The main title displayed at the top of the dashboard and in the browser tab.
*   **`secondary color hex`**: A 6-character hex color code (e.g., `#58508d`) that will be used for some visualizations on the site.
*   **`data file name`**: The specific filename (e.g., `ebird-data-latest.csv`) inside the `observation-data/` folder that the site should read.
