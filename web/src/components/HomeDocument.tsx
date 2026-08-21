'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';
import { FieldNote } from '@/lib/parseFieldNotes';
import { SiteOptions } from '@/lib/parseOptions';
import { formatDate } from '@/lib/formatDate';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ImageLightbox from './ImageLightbox';
import MapView from './Map';
import { MediaGrid } from './ui/MediaGrid';
import { SearchIcon } from './ui/Icons';

interface HomeDocumentProps {
  data: EbirdObservation[];
  mediaData: EbirdMediaObservation[];
  fieldNotes: FieldNote[];
  options: SiteOptions;
}

const SECTIONS = [
  { id: 'sec-map', label: 'Map' },
  { id: 'sec-locations', label: 'Locations' },
  { id: 'sec-media', label: 'Media' },
  { id: 'sec-notes', label: 'Field Notes' },
  { id: 'sec-refs', label: 'Reference' },
];

const ABOUT_LINKS = [
  { label: 'Github Repository', href: 'https://github.com/felipeharker/hark-ornithology', desc: 'See underlying project codebase, contribute your own ideas, and host this site locally.' },
  { label: 'Design Standards', href: '/design-standards', desc: 'Fonts, spacing, type scale and formatting conventions used throughout this site.' },
  { label: 'eBird Account', href: 'https://ebird.org/profile/ODE0ODA5NQ/world', desc: 'All checklists, locations, observations, and more can also be seen on eBird.' },
  { label: 'Macaulay Library', href: 'https://media.ebird.org/catalog?unconfirmed=incl&mediaType=photo&userId=USER8148095', desc: 'Media such as images, audio, and video recordings are cataloged on Macaulay Library.' },
  { label: 'Merlin Bird ID', href: 'https://merlin.allaboutbirds.org/', desc: 'State-of-the-art visual and audio bird identification mobile app. Invaluable resource for any birder.' },
];

function HomeDocumentInner({ data, mediaData, fieldNotes, options }: HomeDocumentProps) {
  const searchParams = useSearchParams();
  const initialLocationId = searchParams.get('locationId');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(initialLocationId);
  const [locationFilter, setLocationFilter] = useState('');
  const [activeSection, setActiveSection] = useState('sec-map');
  const [lightbox, setLightbox] = useState<{ items: EbirdMediaObservation[]; index: number } | null>(null);
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (selectedLocationId && rowRefs.current[selectedLocationId]) {
      setTimeout(() => {
        rowRefs.current[selectedLocationId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [selectedLocationId]);

  const selectLocation = (id: string | null) => {
    const next = selectedLocationId === id ? null : id;
    setSelectedLocationId(next);
    const newUrl = next ? `?locationId=${next}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  };

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
      if (!map.has(obs.CommonName)) map.set(obs.CommonName, { common: obs.CommonName, sci: obs.ScientificName, total: 0, onlyX: true });
      const entry = map.get(obs.CommonName)!;
      if (obs.Count !== 'X' && obs.Count !== '') {
        const n = parseInt(obs.Count, 10);
        if (!isNaN(n)) { entry.total += n; entry.onlyX = false; }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.onlyX && !b.onlyX) return 1;
      if (!a.onlyX && b.onlyX) return -1;
      if (!a.onlyX && !b.onlyX) return b.total - a.total;
      return a.common.localeCompare(b.common);
    });
  }, [locationData]);

  const mediaGroups = useMemo(() => {
    const groups: Record<string, { checklistId: string; date: string; time: string; location: string; items: EbirdMediaObservation[] }> = {};
    for (const m of mediaData) {
      if (!groups[m.eBirdChecklistID]) {
        groups[m.eBirdChecklistID] = { checklistId: m.eBirdChecklistID, date: m.Date, time: m.Time, location: m.Locality, items: [] };
      }
      groups[m.eBirdChecklistID].items.push(m);
    }
    const sorted = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    return sorted.reduce<Array<(typeof sorted)[number] & { figOffset: number }>>((acc, grp) => {
      const prevOffset = acc.length ? acc[acc.length - 1].figOffset + acc[acc.length - 1].items.length : 0;
      acc.push({ ...grp, figOffset: prevOffset });
      return acc;
    }, []);
  }, [mediaData]);

  const latestChecklist = useMemo(() => {
    const dates = data.map((obs) => obs.Date).filter(Boolean).sort().reverse();
    return dates.length ? formatDate(dates[0]) : '—';
  }, [data]);

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', minHeight: '100vh' }}>
      <div className="flex gap-8 max-w-[1000px] mx-auto px-4 items-start">
        <aside className="hidden md:block w-[160px] shrink-0 sticky top-6 pt-8">
          <nav aria-label="Sections">
            <ol className="list-none p-0 m-0 flex flex-col gap-1">
              {SECTIONS.map((s, i) => {
                const active = s.id === activeSection;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      style={{
                        display: 'block',
                        padding: 'var(--space-2) 0 var(--space-2) var(--space-3)',
                        borderLeft: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
                        color: active ? 'var(--color-accent-700)' : 'var(--color-text)',
                        fontWeight: active ? 700 : 400,
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                        textDecoration: 'none',
                      }}
                    >
                      {i + 1}. {s.label}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        <main className="max-w-[720px] flex-1 min-w-0" style={{ padding: 'var(--space-8) 0 calc(var(--space-8) * 2)', lineHeight: 1.6 }}>
          <header>
            <h1 style={{ margin: '0 0 2px' }}>{options.title}</h1>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.7 }}>Felipe Harker · Observer</div>

            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '2px solid var(--color-divider)' }}>
              <div className="hk-label" style={{ marginBottom: 'var(--space-2)' }}>Abstract</div>
              <p style={{ maxWidth: '68ch', fontSize: 16, margin: 0 }}>
                This project catalogs and shares birding observations from around the world, with checklists and media
                hosted on eBird and the Macaulay Library. It began as an experiment merging a love of birds with web
                development, and remains under active, frequent development.
              </p>
            </div>
          </header>

          {/* 1. Map */}
          <section id="sec-map" style={sectionStyle}>
            <SectionHeading n={1} label="Map" />
            <div style={{ width: '100%', height: 480, border: '1px solid var(--color-divider)', marginTop: 'var(--space-4)' }}>
              <MapView data={data} selectedLocationId={selectedLocationId} onLocationSelect={selectLocation} />
            </div>
            <div className="hk-figcap" style={{ marginTop: 'var(--space-2)' }}>
              Figure 1 — {locations.length} locations plotted from recorded coordinates.
            </div>

            {selectedLocation && (
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-divider)' }}>
                <div className="hk-label">Selected</div>
                <h3 style={{ margin: 'var(--space-1) 0 var(--space-1)' }}>{selectedLocation.name}</h3>
                <p style={{ margin: '0 0 var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.7 }}>
                  {selectedLocation.place} · {selectedLocation.count} observations
                </p>
                <a href="#sec-locations">View in Location Index →</a>
              </div>
            )}
          </section>

          {/* 2. Locations */}
          <section id="sec-locations" style={sectionStyle}>
            <SectionHeading n={2} label="Locations" />
            <div className="field" style={{ position: 'relative', marginTop: 'var(--space-4)', maxWidth: 340 }}>
              <label htmlFor="loc-filter" style={visuallyHidden}>Filter locations by name</label>
              <span style={{ position: 'absolute', left: 10, top: 11, opacity: 0.5, pointerEvents: 'none' }}>
                <SearchIcon size={15} />
              </span>
              <input
                id="loc-filter"
                className="input"
                style={{ paddingLeft: 32 }}
                placeholder="Filter locations by name…"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            <table className="table" style={{ marginTop: 'var(--space-4)' }}>
              <thead>
                <tr><th>Location</th><th>Place</th><th style={{ textAlign: 'right' }}>Obs.</th></tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => {
                  const isSelected = loc.id === selectedLocationId;
                  return (
                    <React.Fragment key={loc.id}>
                      <tr
                        ref={(el) => { rowRefs.current[loc.id] = el; }}
                        onClick={() => selectLocation(loc.id)}
                        style={{
                          cursor: 'pointer',
                          borderLeft: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
                        }}
                      >
                        <td>
                          <strong>{loc.name}</strong>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{loc.place}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{loc.count}</td>
                      </tr>
                      {isSelected && (
                        <tr>
                          <td colSpan={3} style={{ background: 'var(--color-surface)', padding: 0 }}>
                            <div style={{ padding: 'var(--space-4) var(--space-3)' }}>
                              <div className="hk-label" style={{ marginBottom: 'var(--space-2)' }}>Checklists</div>
                              {selectedChecklists.length > 0 ? (
                                <div style={{ marginBottom: 'var(--space-6)' }}>
                                  {selectedChecklists.map((cl) => (
                                    <div key={cl.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'baseline', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13 }}>
                                      <span style={{ fontFamily: 'var(--font-mono)', width: 170, flexShrink: 0 }}>{cl.date} {cl.time}</span>
                                      <a href={`/checklist/${cl.id}?locationId=${loc.id}`}>
                                        {cl.hasMedia ? 'Checklist and Media Report →' : 'Checklist Report →'}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="hk-figcap" style={{ marginBottom: 'var(--space-6)' }}>No checklists available.</p>
                              )}

                              <div className="hk-label" style={{ marginBottom: 'var(--space-2)' }}>Species Observed</div>
                              <table className="table" style={{ background: 'var(--color-bg)' }}>
                                <thead><tr><th>Species</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                                <tbody>
                                  {selectedSpecies.map((sp) => (
                                    <tr key={sp.common}>
                                      <td>
                                        <div>{sp.common}</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: 12, opacity: 0.6 }}>{sp.sci}</div>
                                      </td>
                                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{sp.onlyX ? 'X' : sp.total}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="hk-figcap" style={{ marginTop: 'var(--space-2)' }}>Table — species totals at {loc.name}.</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            <div className="hk-figcap" style={{ marginTop: 'var(--space-2)' }}>Table 1 — study locations and total observations recorded.</div>
            {filteredLocations.length === 0 && (
              <p style={{ fontFamily: 'var(--font-mono)', opacity: 0.55, fontStyle: 'italic', marginTop: 'var(--space-3)' }}>
                No locations match &ldquo;{locationFilter}&rdquo;.
              </p>
            )}
          </section>

          {/* 3. Media */}
          <section id="sec-media" style={sectionStyle}>
            <SectionHeading n={3} label="Media" />
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {mediaGroups.map((grp) => (
                <div key={grp.checklistId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--color-divider)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16 }}>{grp.location}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                      <span>{grp.date} {grp.time}</span>
                      <a href={`/checklist/${grp.checklistId}`}>Checklist Report →</a>
                    </div>
                  </div>
                  <MediaGrid items={grp.items} figOffset={grp.figOffset} onSelect={(idx) => setLightbox({ items: grp.items, index: idx })} />
                </div>
              ))}
              {mediaGroups.length === 0 && <p className="hk-figcap">No media available.</p>}
            </div>
          </section>

          {/* 4. Field Notes */}
          <section id="sec-notes" style={sectionStyle}>
            <SectionHeading n={4} label="Field Notes" />
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {fieldNotes.map((note, i) => (
                <div key={note.id}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.5 }}>4.{i + 1}</span>
                    <h3 style={{ margin: 0 }}>{note.title}</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.8, borderBottom: '1px solid var(--color-divider)', paddingBottom: 'var(--space-3)', margin: 'var(--space-2) 0 var(--space-3)' }}>
                    <div><strong style={{ opacity: 0.6 }}>Date&nbsp;</strong>{note.date}</div>
                    {note.location && <div><strong style={{ opacity: 0.6 }}>Location&nbsp;</strong>{note.location}</div>}
                    {note.conditions && <div><strong style={{ opacity: 0.6 }}>Conditions&nbsp;</strong>{note.conditions}</div>}
                    {note.links && note.links.length > 0 && (
                      <div>
                        <strong style={{ opacity: 0.6 }}>Links&nbsp;</strong>
                        {note.links.map((link) => (
                          <a key={link} href={link} target="_blank" rel="noopener noreferrer" style={{ marginRight: 'var(--space-2)' }}>{link}</a>
                        ))}
                      </div>
                    )}
                  </div>
                  {note.content && (
                    <div className="prose" style={{ maxWidth: '68ch', fontSize: 15 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {fieldNotes.length === 0 && <p className="hk-figcap">No field notes available.</p>}
            </div>
          </section>

          {/* 5. Reference */}
          <section id="sec-refs" style={sectionStyle}>
            <SectionHeading n={5} label="Reference" />
            <ol style={{ listStyle: 'none', padding: 0, margin: 'var(--space-4) 0 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {ABOUT_LINKS.map((link, i) => (
                <li key={link.href} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.5, flexShrink: 0 }}>[{i + 1}]</span>
                  <span>
                    <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{link.label}</a>
                    <span style={{ fontSize: 14, opacity: 0.75 }}> — {link.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <footer style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-divider)', fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.55 }}>
            Data current as of {latestChecklist}. Compiled from eBird checklist exports —{' '}
            <a href="https://github.com/felipeharker/hark-ornithology" target="_blank" rel="noopener noreferrer">source on GitHub</a>.
          </footer>
        </main>
      </div>

      {lightbox && (
        <ImageLightbox mediaList={lightbox.items} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  marginTop: 'var(--space-8)',
  paddingTop: 'var(--space-6)',
  borderTop: '2px solid var(--color-divider)',
};

const visuallyHidden: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)',
};

function SectionHeading({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, opacity: 0.5 }}>{n}.</span>
      <h2 style={{ margin: 0 }}>{label}</h2>
    </div>
  );
}

export default function HomeDocument(props: HomeDocumentProps) {
  return (
    <Suspense fallback={<div className="p-8 hk-figcap">Loading…</div>}>
      <HomeDocumentInner {...props} />
    </Suspense>
  );
}
