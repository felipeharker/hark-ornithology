repo: felipeharker/hark-ornithology
branch: main
path: web

## Last sync
date: 2026-08-20T18:11:08Z

### Updated in this project
- Redesigned the live site itself onto the standardized system: a Home dashboard (nav, masthead, Map/Lists/Media/Notes/About accordion) and a Checklist detail page, both applying the decisions log from the design-system reference
- Map tab embeds a real Leaflet + OpenStreetMap map (plain HTML, not a DC, per mapping constraints); all content pulled from one shared data file grounded in the repo's real eBird CSV rows (species, locations, checklists, field notes)

## Sync history
- 2026-08-20T17:18:55Z — Checked upstream: no file changes since the previous sync — nothing to rebuild
- 2026-08-20T16:24:03Z — Built the Modernist-standardized design-system reference for the eBird dashboard (color, type, icons, imagery, component mapping); 2 decisions settled from your answers (new nav bar, hard-coded accent), 5 flagged for review (grayscale exemption for bird media, data mono typeface, accent-driven selection state, ink chart line, cards-vs-rules)

## Screen map
| Project screen | Repo files |
| --- | --- |
| Hark Ornithology Design System.dc.html | web/src/app/page.tsx, web/src/app/layout.tsx, web/src/app/globals.css, web/src/components/LocationDashboard.tsx, web/src/components/LocationDetailPanel.tsx, web/src/components/ChecklistClientView.tsx, web/src/components/ImageLightbox.tsx, web/src/components/Map.tsx, web/src/components/ui/AccordionSection.tsx, web/src/components/ui/Badge.tsx, web/src/components/ui/EmptyState.tsx, web/src/components/ui/Icons.tsx, web/src/components/ui/MediaGrid.tsx, web/src/components/ui/Panel.tsx, web/src/app/checklist/[id]/page.tsx, web/src/lib/parseOptions.ts, public/options.csv |
| Hark Ornithology Home.dc.html | web/src/app/page.tsx, web/src/components/LocationDashboard.tsx, web/src/components/LocationDetailPanel.tsx, web/src/components/ui/AccordionSection.tsx, web/src/components/ui/Panel.tsx, web/src/components/ui/MediaGrid.tsx, web/src/components/Map.tsx |
| Hark Ornithology Checklist.dc.html | web/src/app/checklist/[id]/page.tsx, web/src/components/ChecklistClientView.tsx, web/src/components/ui/Badge.tsx, web/src/components/ui/Icons.tsx |
| hark-map.html, hark-data.js | observation-data/ebird-data-latest.csv (+ archive samples), web/src/lib/parseEbirdData.ts, web/field-notes/*.md |
