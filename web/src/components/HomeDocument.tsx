'use client';

/**
 * The homepage: one document, five sections.
 *
 *   Map          — every recorded location, plotted from the observation CSV
 *   Locations    — every site, one collapsible row each, expanding to its detail
 *   Media        — Macaulay Library photos, one collapsible row per checklist
 *   Field Notes  — Markdown trip reports from web/field-notes/
 *   Reference    — links to the project's other homes, gathered at the foot
 *
 * Nothing here is numbered. Sections, subsections, figures and references all
 * used to carry a numeral; none of them was ever referred to by number, so the
 * numbering was upkeep with no reader on the other end of it.
 *
 * Locations and Media are the same list twice: a section of rows, each a
 * disclosure that opens in place. The difference is that a location can also
 * be opened from outside its own row — by a map pin or a ?locationId= link —
 * so those rows are controlled and only one of them is open at a time, where
 * the media rows are plain browser <details>.
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
import { SITE_LINKS, externalLinkProps } from '@/lib/siteLinks';
import ImageLightbox from './ImageLightbox';
import MapView from './Map';
import { MediaGrid } from './ui/MediaGrid';
import { Masthead } from './ui/Masthead';
import { Section, Disclosure } from './ui/Section';
import { SearchIcon } from './ui/Icons';

interface HomeDocumentProps {
  data: EbirdObservation[];
  mediaData: EbirdMediaObservation[];
  fieldNotes: FieldNote[];
  abstract: string;
  options: SiteOptions;
}

/**
 * The document's sections, in order. The table of contents and the headings
 * both read from this list, so reordering it reorders the index too.
 */
const SECTIONS = [
  { id: 'sec-map', label: 'Map' },
  { id: 'sec-locations', label: 'Locations' },
  { id: 'sec-media', label: 'Media' },
  { id: 'sec-notes', label: 'Field Notes' },
  { id: 'sec-refs', label: 'Reference' },
];

/** Further reading, listed plainly at the foot of the page. */
const REFERENCES = [
  {
    label: 'Github Repository',
    href: SITE_LINKS.repository,
    desc: 'See underlying project codebase, contribute your own ideas, and host this site locally.',
  },
  {
    label: 'Design Standards',
    href: '/design-standards',
    desc: 'Fonts, spacing, type scale and formatting conventions used throughout this site.',
  },
  {
    label: 'eBird Account',
    href: SITE_LINKS.ebirdProfile,
    desc: 'All checklists, locations, observations, and more can also be seen on eBird.',
  },
  {
    label: 'Macaulay Library',
    href: SITE_LINKS.macaulayLibrary,
    desc: 'Media such as images, audio, and video recordings are cataloged on Macaulay Library.',
  },
  {
    label: 'Merlin Bird ID',
    href: SITE_LINKS.merlin,
    desc: 'State-of-the-art visual and audio bird identification mobile app. Invaluable resource for any birder.',
  },
];

function HomeDocumentInner({ data, mediaData, fieldNotes, abstract, options }: HomeDocumentProps) {
  const searchParams = useSearchParams();
  const initialLocationId = searchParams.get('locationId');

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(initialLocationId);
  const [locationFilter, setLocationFilter] = useState('');
  const [lightbox, setLightbox] = useState<{ items: EbirdMediaObservation[]; index: number } | null>(null);

  const locationRefs = useRef<{ [key: string]: HTMLDetailsElement | null }>({});

  // Bring a newly selected location's row into view — it may have been chosen
  // from the map, well above the list. The delay gives the row a frame to open
  // first, so the scroll lands on its full height rather than on the summary.
  useEffect(() => {
    if (!selectedLocationId) return;
    const timer = setTimeout(() => {
      locationRefs.current[selectedLocationId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedLocationId]);

  /** Select a location, or clear the selection if it is already the open one. */
  const selectLocation = (id: string | null) => {
    const next = selectedLocationId === id ? null : id;
    setSelectedLocationId(next);
    window.history.pushState({}, '', next ? `?locationId=${next}` : window.location.pathname);
  };

  // A location row reports its own open state, and the browser fires that
  // event for openings this component asked for too — closing the previously
  // open row, or opening the row a map pin just selected. Since selectLocation
  // toggles, act only when the row and the selection actually disagree;
  // otherwise the echo would immediately undo the selection.
  const setLocationOpen = (id: string, open: boolean) => {
    if (open ? selectedLocationId !== id : selectedLocationId === id) selectLocation(id);
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

  // Busiest site first, then alphabetically. The order does not change when a
  // location is opened: a row that jumps to the top of the list as you click
  // it takes the page out from under the reader, and the selected row is
  // scrolled into view anyway.
  const filteredLocations = useMemo(() => {
    const query = locationFilter.trim().toLowerCase();
    return locations
      .filter((l) => l.name.toLowerCase().includes(query))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [locations, locationFilter]);

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

  /** Media grouped by the checklist it was submitted with, newest first. */
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
    return Object.values(groups).sort(
      (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)
    );
  }, [mediaData]);

  const latestChecklist = useMemo(() => {
    const dates = data.map((obs) => obs.Date).filter(Boolean).sort().reverse();
    return dates.length ? formatDate(dates[0]) : '—';
  }, [data]);

  return (
    <article className="doc">
      <Masthead
        kicker="Ornithological Report · eBird Observation Data"
        title={options.title}
        subtitle="A Record of Field Observations, Checklists, and Media"
        byline="Felipe Harker"
        dateline={`Data current as of ${latestChecklist}`}
      />
      <hr className="rule" />

      {/* -- Abstract (text from web/content/abstract.md) ------------------ */}
      {abstract && (
        <>
          <div className="abstract">
            <p className="abstract-label">Abstract</p>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{abstract}</ReactMarkdown>
          </div>
          <hr className="rule-soft" />
        </>
      )}

      {/* -- Contents ------------------------------------------------------- */}
      <nav aria-label="Contents">
        <p className="toc-label">Contents</p>
        <ul className="toc">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* -- Map ------------------------------------------------------------ */}
      <Section id="sec-map" title="Map">
        <MapView data={data} selectedLocationId={selectedLocationId} onLocationSelect={selectLocation} />

        {selectedLocation && (
          <div className="selected-note">
            <p className="label">Selected</p>
            <h3 className="selected-note-title">{selectedLocation.name}</h3>
            <p className="data">{selectedLocation.place}</p>
            <p className="selected-note-link">
              <a href="#sec-locations">View in the location index →</a>
            </p>
          </div>
        )}
      </Section>

      {/* -- Locations -------------------------------------------------------
          Every site, listed in the same shape as Media below it: a row per
          location, opening in place to its checklists and species. The rows
          are controlled rather than plain <details> because a map pin and a
          ?locationId= link both open one from outside, and because only one
          location is open at a time — the panel is built from the selection,
          not from the row. */}
      <Section id="sec-locations" title="Locations">
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

        <div className="location-list">
          {filteredLocations.map((loc) => (
            <Disclosure
              key={loc.id}
              title={loc.name}
              open={loc.id === selectedLocationId}
              onToggle={(open) => setLocationOpen(loc.id, open)}
              ref={(el) => {
                locationRefs.current[loc.id] = el;
              }}
            >
              {/* Place and observation count were the table's other two
                  columns; they read as the row's metadata line, exactly as
                  a media group's date and time do. */}
              <p className="disclosure-meta">
                {loc.place && <span>{loc.place}</span>}
                <span>
                  {loc.count} {loc.count === 1 ? 'observation' : 'observations'}
                </span>
              </p>

              {/* Only the open row's panel is built, so the two tables below
                  can read from the current selection rather than being
                  recomputed for every location in the list. */}
              {loc.id === selectedLocationId && (
                <>
                  <div className="detail-group">
                    <p className="label">Checklists</p>
                    {selectedChecklists.length > 0 ? (
                      <ul className="link-list">
                        {selectedChecklists.map((cl) => (
                          <li key={cl.id}>
                            <span className="data">
                              {cl.date} {cl.time}
                            </span>
                            <a href={`/checklist/${cl.id}?locationId=${loc.id}`}>
                              {cl.hasMedia ? 'Checklist and Media Report →' : 'Checklist Report →'}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty">No checklists available.</p>
                    )}
                  </div>

                  <div className="detail-group">
                    <p className="label">Species Observed</p>
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
                  </div>
                </>
              )}
            </Disclosure>
          ))}
        </div>

        {filteredLocations.length === 0 && (
          <p className="empty">No locations match &ldquo;{locationFilter}&rdquo;.</p>
        )}
      </Section>

      {/* -- Media -----------------------------------------------------------
          The same list as Locations above: the section stays open, and each
          checklist's photos are a collapsed row, so the page reads as an
          index until a row is opened. */}
      <Section id="sec-media" title="Media">
        {mediaGroups.map((grp) => (
          <Disclosure key={grp.checklistId} title={grp.location}>
            <p className="disclosure-meta">
              <span>
                {grp.date} {grp.time}
              </span>
              <a href={`/checklist/${grp.checklistId}`}>Checklist Report →</a>
            </p>
            <MediaGrid
              items={grp.items}
              onSelect={(idx) => setLightbox({ items: grp.items, index: idx })}
            />
          </Disclosure>
        ))}

        {mediaGroups.length === 0 && <p className="empty">No media available.</p>}
      </Section>

      {/* -- Field Notes ----------------------------------------------------- */}
      <Section id="sec-notes" title="Field Notes">
        {fieldNotes.map((note) => (
          <div className="note" key={note.id}>
            <h3 className="note-title">{note.title}</h3>

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
                      <a key={link} href={link} {...externalLinkProps(link)}>
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
      </Section>

      {/* -- Reference --------------------------------------------------------
          Plain links with a line of description each. Nothing in the prose
          above points at them with a marker; they are further reading, not
          citations a sentence depends on. */}
      <Section id="sec-refs" title="Reference">
        <ul className="reference-list">
          {REFERENCES.map((ref) => (
            <li key={ref.href}>
              <a href={ref.href} {...externalLinkProps(ref.href)}>
                {ref.label}
              </a>
              <span className="desc">{ref.desc}</span>
            </li>
          ))}
        </ul>
      </Section>

      <p className="colophon">
        Data current as of {latestChecklist}. Compiled from eBird checklist exports —{' '}
        <a href={SITE_LINKS.repository} {...externalLinkProps(SITE_LINKS.repository)}>
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
