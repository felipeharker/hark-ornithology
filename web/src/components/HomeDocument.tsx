'use client';

/**
 * The homepage: one document, five numbered sections.
 *
 *   1. Map           — every recorded location, plotted from the observation CSV
 *   2. Locations     — collapsible index of sites, each expanding to its detail
 *   3. Media         — Macaulay Library photos, one collapsible group per checklist
 *   4. Field Notes   — Markdown trip reports from web/field-notes/
 *   5. Reference     — numbered bibliography of related links
 *
 * All content arrives as props from src/app/page.tsx, which reads it from the
 * CSV and Markdown files at build time. This component holds interaction state
 * only — which location is selected, and the filter text.
 *
 * Styling lives entirely in src/app/styles_primary.css (and styles_map.css for
 * the map); there are no inline style objects here.
 */

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EbirdObservation } from '@/lib/parseEbirdData';
import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';
import { FieldNote } from '@/lib/parseFieldNotes';
import { SiteOptions } from '@/lib/parseOptions';
import { formatDate } from '@/lib/formatDate';
import ImageLightbox from './ImageLightbox';
import MapView from './Map';
import { MediaGrid } from './ui/MediaGrid';
import { SearchIcon } from './ui/Icons';

interface HomeDocumentProps {
  data: EbirdObservation[];
  mediaData: EbirdMediaObservation[];
  fieldNotes: FieldNote[];
  abstract: string;
  options: SiteOptions;
}

// Section numbering is derived from this list, so reordering it renumbers both
// the table of contents and the headings.
const SECTIONS = [
  { id: 'sec-map', label: 'Map' },
  { id: 'sec-locations', label: 'Locations' },
  { id: 'sec-media', label: 'Media' },
  { id: 'sec-notes', label: 'Field Notes' },
  { id: 'sec-refs', label: 'Reference' },
];

const REFERENCES = [
  {
    label: 'Github Repository',
    href: 'https://github.com/felipeharker/hark-ornithology',
    desc: 'See underlying project codebase, contribute your own ideas, and host this site locally.',
  },
  {
    label: 'Design Standards',
    href: '/design-standards',
    desc: 'Fonts, spacing, type scale and formatting conventions used throughout this site.',
  },
  {
    label: 'eBird Account',
    href: 'https://ebird.org/profile/ODE0ODA5NQ/world',
    desc: 'All checklists, locations, observations, and more can also be seen on eBird.',
  },
  {
    label: 'Macaulay Library',
    href: 'https://media.ebird.org/catalog?unconfirmed=incl&mediaType=photo&userId=USER8148095',
    desc: 'Media such as images, audio, and video recordings are cataloged on Macaulay Library.',
  },
  {
    label: 'Merlin Bird ID',
    href: 'https://merlin.allaboutbirds.org/',
    desc: 'State-of-the-art visual and audio bird identification mobile app. Invaluable resource for any birder.',
  },
];

function HomeDocumentInner({ data, mediaData, fieldNotes, abstract, options }: HomeDocumentProps) {
  const searchParams = useSearchParams();
  const initialLocationId = searchParams.get('locationId');

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(initialLocationId);
  const [locationFilter, setLocationFilter] = useState('');
  const [lightbox, setLightbox] = useState<{ items: EbirdMediaObservation[]; index: number } | null>(null);

  // The Locations section is a <details> that starts closed to keep the page
  // short. Arriving with ?locationId=… — or clicking a map pin — has to open it,
  // so its `open` state is controlled rather than left to the browser.
  const [locationsOpen, setLocationsOpen] = useState(Boolean(initialLocationId));
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  // Scroll a newly selected location's row into view, once the section has had
  // a frame to expand.
  useEffect(() => {
    if (!selectedLocationId) return;
    const timer = setTimeout(() => {
      rowRefs.current[selectedLocationId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedLocationId, locationsOpen]);

  const selectLocation = (id: string | null) => {
    const next = selectedLocationId === id ? null : id;
    setSelectedLocationId(next);
    if (next) setLocationsOpen(true);
    window.history.pushState({}, '', next ? `?locationId=${next}` : window.location.pathname);
  };

  // -- Derived data --------------------------------------------------------
  // Every figure below is computed from the parsed CSV rows; nothing is stored.

  const locations = useMemo(() => {
    const map = new Map<string, { id: string; name: string; place: string; count: number }>();
    data.forEach((obs) => {
      if (!obs.LocationID) return;
      if (!map.has(obs.LocationID)) {
        map.set(obs.LocationID, {
          id: obs.LocationID,
          name: obs.Location,
          place: [obs.County, obs.StateProvince].filter(Boolean).join(', '),
          count: 0,
        });
      }
      map.get(obs.LocationID)!.count += 1;
    });
    return Array.from(map.values());
  }, [data]);

  const filteredLocations = useMemo(() => {
    const query = locationFilter.trim().toLowerCase();
    return locations
      .filter((l) => l.name.toLowerCase().includes(query))
      .sort((a, b) => {
        // Keep the selected location pinned to the top while it is expanded.
        if (selectedLocationId) {
          if (a.id === selectedLocationId) return -1;
          if (b.id === selectedLocationId) return 1;
        }
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }, [locations, locationFilter, selectedLocationId]);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) || null,
    [locations, selectedLocationId]
  );

  const locationData = useMemo(
    () => (selectedLocationId ? data.filter((obs) => obs.LocationID === selectedLocationId) : []),
    [data, selectedLocationId]
  );

  const selectedChecklists = useMemo(() => {
    const map: Record<string, { id: string; date: string; time: string; hasMedia: boolean }> = {};
    for (const obs of locationData) {
      if (obs.SubmissionID && !map[obs.SubmissionID]) {
        map[obs.SubmissionID] = {
          id: obs.SubmissionID,
          date: obs.Date,
          time: obs.Time,
          hasMedia: mediaData.some((m) => m.eBirdChecklistID === obs.SubmissionID),
        };
      }
    }
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [locationData, mediaData]);

  const selectedSpecies = useMemo(() => {
    const map = new Map<string, { common: string; sci: string; total: number; onlyX: boolean }>();
    for (const obs of locationData) {
      if (!map.has(obs.CommonName)) {
        map.set(obs.CommonName, { common: obs.CommonName, sci: obs.ScientificName, total: 0, onlyX: true });
      }
      const entry = map.get(obs.CommonName)!;
      // eBird records an unspecified quantity as "X"; a species seen only as X
      // has no numeric total and sorts to the bottom.
      if (obs.Count !== 'X' && obs.Count !== '') {
        const n = parseInt(obs.Count, 10);
        if (!isNaN(n)) {
          entry.total += n;
          entry.onlyX = false;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.onlyX !== b.onlyX) return a.onlyX ? 1 : -1;
      if (!a.onlyX && !b.onlyX) return b.total - a.total;
      return a.common.localeCompare(b.common);
    });
  }, [locationData]);

  // Media grouped by the checklist it was submitted with. `figOffset` lets
  // figure numbering run continuously across every group on the page.
  const mediaGroups = useMemo(() => {
    const groups: Record<string, { checklistId: string; date: string; time: string; location: string; items: EbirdMediaObservation[] }> = {};
    for (const m of mediaData) {
      if (!groups[m.eBirdChecklistID]) {
        groups[m.eBirdChecklistID] = {
          checklistId: m.eBirdChecklistID,
          date: m.Date,
          time: m.Time,
          location: m.Locality,
          items: [],
        };
      }
      groups[m.eBirdChecklistID].items.push(m);
    }
    const sorted = Object.values(groups).sort(
      (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)
    );
    return sorted.reduce<Array<(typeof sorted)[number] & { figOffset: number }>>((acc, grp) => {
      const prev = acc[acc.length - 1];
      acc.push({ ...grp, figOffset: prev ? prev.figOffset + prev.items.length : 0 });
      return acc;
    }, []);
  }, [mediaData]);

  const latestChecklist = useMemo(() => {
    const dates = data.map((obs) => obs.Date).filter(Boolean).sort().reverse();
    return dates.length ? formatDate(dates[0]) : '—';
  }, [data]);

  const totalMedia = mediaGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <article className="doc">
      {/* -- Masthead ------------------------------------------------------ */}
      <p className="kicker">Ornithological Report &middot; eBird Observation Data</p>
      <h1 className="title">{options.title}</h1>
      <p className="subtitle">A Record of Field Observations, Checklists, and Media</p>
      <p className="byline">Felipe Harker</p>
      <p className="dateline">Data current as of {latestChecklist}</p>
      <hr className="rule" />

      {/* -- Abstract (text from web/content/abstract.md) ------------------ */}
      {abstract && (
        <>
          <div className="abstract">
            <p className="abstract-label">Abstract</p>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{abstract}</ReactMarkdown>
            <p className="keywords">
              Keywords: ornithology; birding; eBird; Macaulay Library; field observation;
              checklist; species distribution.
            </p>
          </div>
          <hr className="rule-soft" />
        </>
      )}

      {/* -- Table of contents --------------------------------------------- */}
      <nav aria-label="Contents">
        <p className="toc-label">Contents</p>
        <ol className="toc">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>
                <span className="num">{i + 1}</span>
                <span>{s.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* -- 1. Map --------------------------------------------------------- */}
      <section className="section" id="sec-map">
        <h2 className="section-heading">
          <span className="num">1</span>
          <span>Map</span>
        </h2>
        <MapView data={data} selectedLocationId={selectedLocationId} onLocationSelect={selectLocation} />
        <p className="caption">
          Figure 1 — {locations.length} locations plotted from recorded coordinates. Select a pin
          to open that location below.
        </p>

        {selectedLocation && (
          <div className="selected-note">
            <p className="label">Selected</p>
            <h3 className="selected-note-title">{selectedLocation.name}</h3>
            <p className="data">
              {selectedLocation.place} · {selectedLocation.count} observations
            </p>
            <p className="selected-note-link">
              <a href="#sec-locations">View in the location index →</a>
            </p>
          </div>
        )}
      </section>

      {/* -- 2. Locations ---------------------------------------------------
          The whole section collapses. It holds the longest table on the page,
          so it starts closed unless a location is already selected. */}
      <section className="section" id="sec-locations">
        <details
          className="disclosure"
          open={locationsOpen}
          onToggle={(e) => setLocationsOpen((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary>
            <span className="disclosure-heading">
              <span className="num">2</span>
              <span>Locations</span>
              <span className="disclosure-hint">
                <span className="hint-closed">Show {locations.length} locations</span>
                <span className="hint-open">Hide</span>
              </span>
            </span>
          </summary>

          <div className="disclosure-body">
            <div className="field">
              <label htmlFor="loc-filter" className="visually-hidden">
                Filter locations by name
              </label>
              <span className="field-icon">
                <SearchIcon size={15} />
              </span>
              <input
                id="loc-filter"
                className="input"
                placeholder="Filter by name…"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Place</th>
                    <th className="num-cell">Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((loc) => {
                    const isSelected = loc.id === selectedLocationId;
                    return (
                      <React.Fragment key={loc.id}>
                        <tr
                          ref={(el) => {
                            rowRefs.current[loc.id] = el;
                          }}
                          className="row-toggle"
                          data-selected={isSelected}
                          onClick={() => selectLocation(loc.id)}
                        >
                          <td>
                            <strong>{loc.name}</strong>
                          </td>
                          <td className="data">{loc.place}</td>
                          <td className="num-cell">{loc.count}</td>
                        </tr>

                        {isSelected && (
                          <tr className="row-detail">
                            <td colSpan={3}>
                              <div className="row-detail-body">
                                <p className="label">Checklists</p>
                                {selectedChecklists.length > 0 ? (
                                  <table className="table table--nested">
                                    <tbody>
                                      {selectedChecklists.map((cl) => (
                                        <tr key={cl.id}>
                                          <td className="data">
                                            {cl.date} {cl.time}
                                          </td>
                                          <td>
                                            <a href={`/checklist/${cl.id}?locationId=${loc.id}`}>
                                              {cl.hasMedia ? 'Checklist and Media Report →' : 'Checklist Report →'}
                                            </a>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="empty">No checklists available.</p>
                                )}

                                <p className="label label--spaced">Species Observed</p>
                                <table className="table table--nested">
                                  <thead>
                                    <tr>
                                      <th>Species</th>
                                      <th className="num-cell">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedSpecies.map((sp) => (
                                      <tr key={sp.common}>
                                        <td>
                                          <div>{sp.common}</div>
                                          <div className="sci">{sp.sci}</div>
                                        </td>
                                        <td className="num-cell">{sp.onlyX ? 'X' : sp.total}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <p className="caption">Table — species totals at {loc.name}.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="caption">Table 1 — study locations and total observations recorded.</p>

            {filteredLocations.length === 0 && (
              <p className="empty">No locations match &ldquo;{locationFilter}&rdquo;.</p>
            )}
          </div>
        </details>
      </section>

      {/* -- 3. Media -------------------------------------------------------
          The section itself stays open, but each checklist's photos are a
          collapsed subsection, so the page opens as a short index. */}
      <section className="section" id="sec-media">
        <h2 className="section-heading">
          <span className="num">3</span>
          <span>Media</span>
        </h2>
        {mediaGroups.map((grp, i) => (
          <details className="disclosure disclosure--sub" key={grp.checklistId}>
            <summary>
              <span className="disclosure-heading">
                <span className="num">3.{i + 1}</span>
                <span>{grp.location}</span>
                <span className="disclosure-hint">
                  <span className="hint-closed">
                    Show {grp.items.length} photo{grp.items.length === 1 ? '' : 's'}
                  </span>
                  <span className="hint-open">Hide</span>
                </span>
              </span>
            </summary>

            <div className="disclosure-body">
              <p className="disclosure-meta">
                <span>
                  {grp.date} {grp.time}
                </span>
                <a href={`/checklist/${grp.checklistId}`}>Checklist Report →</a>
              </p>
              <MediaGrid
                items={grp.items}
                figOffset={grp.figOffset}
                onSelect={(idx) => setLightbox({ items: grp.items, index: idx })}
              />
            </div>
          </details>
        ))}

        {mediaGroups.length === 0 && <p className="empty">No media available.</p>}
      </section>

      {/* -- 4. Field Notes -------------------------------------------------- */}
      <section className="section" id="sec-notes">
        <h2 className="section-heading">
          <span className="num">4</span>
          <span>Field Notes</span>
        </h2>

        {fieldNotes.map((note, i) => (
          <div className="note" key={note.id}>
            <h3 className="note-title">
              <span className="num">4.{i + 1}</span>
              <span>{note.title}</span>
            </h3>

            <dl className="note-meta">
              <dt>Date</dt>
              <dd>{note.date}</dd>
              {note.location && (
                <>
                  <dt>Location</dt>
                  <dd>{note.location}</dd>
                </>
              )}
              {note.conditions && (
                <>
                  <dt>Conditions</dt>
                  <dd>{note.conditions}</dd>
                </>
              )}
              {note.links && note.links.length > 0 && (
                <>
                  <dt>Links</dt>
                  <dd>
                    {note.links.map((link) => (
                      <a key={link} href={link} target="_blank" rel="noopener noreferrer">
                        {link}
                      </a>
                    ))}
                  </dd>
                </>
              )}
            </dl>

            {note.content && (
              <div className="note-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {fieldNotes.length === 0 && <p className="empty">No field notes available.</p>}
      </section>

      {/* -- 5. Reference ---------------------------------------------------- */}
      <section className="section" id="sec-refs">
        <h2 className="section-heading">
          <span className="num">5</span>
          <span>Reference</span>
        </h2>
        <ol className="reference-list">
          {REFERENCES.map((ref, i) => (
            <li key={ref.href}>
              <span className="num">[{i + 1}]</span>
              <span>
                <a
                  href={ref.href}
                  target={ref.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                >
                  {ref.label}
                </a>
                <span className="desc"> — {ref.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="colophon">
        Data current as of {latestChecklist}. Compiled from eBird checklist exports —{' '}
        <a href="https://github.com/felipeharker/hark-ornithology" target="_blank" rel="noopener noreferrer">
          source on GitHub
        </a>
        .
      </p>

      {lightbox && (
        <ImageLightbox
          mediaList={lightbox.items}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </article>
  );
}

export default function HomeDocument(props: HomeDocumentProps) {
  // useSearchParams needs a Suspense boundary during static export.
  return (
    <Suspense fallback={<div className="doc empty">Loading…</div>}>
      <HomeDocumentInner {...props} />
    </Suspense>
  );
}
