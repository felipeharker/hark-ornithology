'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';
import { FieldNote } from '@/lib/parseFieldNotes';
import ImageLightbox from './ImageLightbox';
import LocationDetailPanel from './LocationDetailPanel';
import MapView from './Map';
import { AccordionSection } from './ui/AccordionSection';
import { EmptyState } from './ui/EmptyState';
import { Panel } from './ui/Panel';
import { MediaGrid } from './ui/MediaGrid';
import { SearchIcon } from './ui/Icons';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LocationDashboardProps {
  data: EbirdObservation[];
  mediaData?: EbirdMediaObservation[];
  fieldNotes?: FieldNote[];
  options: {
    title: string;
    secondaryColorHex: string;
    dataFileName: string;
  };
}

type TabView = 'map' | 'list' | 'media' | 'field-notes' | 'about';

function LocationDashboardInner({ data, mediaData = [], fieldNotes = [], options }: LocationDashboardProps) {
  const secondaryColor = options.secondaryColorHex || '#ff6361';
  // Avoid duplicating colors if secondary is the same as the default chart color
  const CHART_COLORS = ['#003f5c', secondaryColor, '#bc5090', '#ffa600', '#58508d'];
  const searchParams = useSearchParams();
  const initialLocationId = searchParams.get('locationId');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(initialLocationId);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabView | null>(initialLocationId ? 'list' : null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentMediaList, setCurrentMediaList] = useState<EbirdMediaObservation[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const locationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const sectionTopRef = useRef<HTMLDivElement>(null);

  const openMedia = (items: EbirdMediaObservation[], index: number) => {
    setCurrentMediaList(items);
    setLightboxIndex(index);
  };

  const locations = useMemo(() => {
    const locMap = new Map<string, { id: string; name: string; count: number, isHotspot: boolean }>();
    data.forEach((obs) => {
      if (obs.LocationID) {
        if (!locMap.has(obs.LocationID)) {
          locMap.set(obs.LocationID, {
            id: obs.LocationID,
            name: obs.Location,
            count: 0,
            isHotspot: obs.LocationID.startsWith('L')
          });
        }
        const entry = locMap.get(obs.LocationID)!;
        entry.count += 1;
      }
    });
    return Array.from(locMap.values()).sort((a, b) => {
      // Prioritize the selected location to always be at the top
      if (selectedLocationId) {
        if (a.id === selectedLocationId) return -1;
        if (b.id === selectedLocationId) return 1;
      }
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [data, selectedLocationId]);

  const filteredLocations = useMemo(() => {
    const query = locationFilter.trim().toLowerCase();
    if (!query) return locations;
    return locations.filter((loc) => loc.name.toLowerCase().includes(query));
  }, [locations, locationFilter]);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === selectedLocationId) || null,
    [locations, selectedLocationId]
  );

  const locationData = useMemo(() => {
    if (!selectedLocationId) return [];
    return data.filter((obs) => obs.LocationID === selectedLocationId);
  }, [data, selectedLocationId]);

  const barChartData = useMemo(() => {
    if (!locationData.length || !data.length) return [];

    const getYearMonth = (dateStr?: string) => {
      if (!dateStr) return null;
      const parts = dateStr.split(/[-/]/);
      if (parts.length >= 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}`;
        } else {
          return `${parts[2]}-${parts[0].padStart(2, '0')}`;
        }
      }
      return null;
    };

    let minDateStr: string | null = null;
    let maxDateStr: string | null = null;
    data.forEach((obs) => {
      const ym = getYearMonth(obs.Date);
      if (ym) {
        if (!minDateStr || ym < minDateStr) minDateStr = ym;
        if (!maxDateStr || ym > maxDateStr) maxDateStr = ym;
      }
    });

    if (!minDateStr || !maxDateStr) return [];

    const minDate: string = minDateStr;
    const maxDate: string = maxDateStr;

    const allMonths: string[] = [];
    let [currYear, currMonth] = minDate.split('-').map(Number);
    const [maxYear, maxMonth] = maxDate.split('-').map(Number);

    while (currYear < maxYear || (currYear === maxYear && currMonth <= maxMonth)) {
      allMonths.push(`${currYear}-${currMonth.toString().padStart(2, '0')}`);
      currMonth++;
      if (currMonth > 12) {
        currMonth = 1;
        currYear++;
      }
    }

    const monthlyCounts = new Map<string, number>();
    allMonths.forEach(m => monthlyCounts.set(m, 0));

    locationData.forEach((obs) => {
      const ym = getYearMonth(obs.Date);
      if (ym && monthlyCounts.has(ym)) {
        monthlyCounts.set(ym, monthlyCounts.get(ym)! + 1);
      }
    });

    return Array.from(monthlyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [locationData, data]);

  const overallTotals = useMemo(() => {
    if (!locationData.length) return [];

    const speciesMap = new Map<string, { sci: string, total: number, hasNumeric: boolean }>();
    for (const obs of locationData) {
      const name = obs.CommonName;
      const sci = obs.ScientificName;
      const countStr = obs.Count;

      if (!speciesMap.has(name)) {
        speciesMap.set(name, { sci, total: 0, hasNumeric: false });
      }
      const entry = speciesMap.get(name)!;

      if (countStr !== 'X' && countStr !== '') {
        const num = parseInt(countStr, 10);
        if (!isNaN(num)) {
          entry.total += num;
          entry.hasNumeric = true;
        }
      }
    }

    const totals = Array.from(speciesMap.entries()).map(([name, data]) => ({
      commonName: name,
      scientificName: data.sci,
      total: data.total,
      onlyX: !data.hasNumeric
    }));

    return totals.sort((a, b) => {
      if (a.onlyX && !b.onlyX) return 1;
      if (!a.onlyX && b.onlyX) return -1;
      if (!a.onlyX && !b.onlyX) return b.total - a.total;
      return a.commonName.localeCompare(b.commonName);
    });
  }, [locationData]);


  const locationChecklists = useMemo(() => {
    if (!locationData.length) return [];

    const checklistsMap: Record<string, { submissionId: string, date: string, time: string, hasMedia: boolean }> = {};
    for (const obs of locationData) {
      if (obs.SubmissionID && !checklistsMap[obs.SubmissionID]) {
        // Check if there's any media for this checklist
        const hasMedia = mediaData.some(m => m.eBirdChecklistID === obs.SubmissionID);
        checklistsMap[obs.SubmissionID] = {
          submissionId: obs.SubmissionID,
          date: obs.Date,
          time: obs.Time,
          hasMedia
        };
      }
    }

    return Object.values(checklistsMap).sort((a, b) => {
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) return dateComparison;
      return b.time.localeCompare(a.time);
    });
  }, [locationData, mediaData]);

  const locationMedia = useMemo(() => {
    if (!selectedLocationId || !mediaData.length) return [];
    // Media associated with selected location
    const filtered = mediaData.filter(m => {
        // ebird media data doesn't have LocationID, we have to match by checklist ID or Locality
        // We can match by eBirdChecklistID present in locationData
        return locationData.some(obs => obs.SubmissionID === m.eBirdChecklistID);
    });

    // Group by checklist
    const grouped: Record<string, { checklistId: string, date: string, time: string, items: EbirdMediaObservation[] }> = {};
    for (const m of filtered) {
        if (!grouped[m.eBirdChecklistID]) {
             grouped[m.eBirdChecklistID] = {
                 checklistId: m.eBirdChecklistID,
                 date: m.Date,
                 time: m.Time,
                 items: []
             };
        }
        grouped[m.eBirdChecklistID].items.push(m);
    }

    return Object.values(grouped).sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        return b.time.localeCompare(a.time);
    });
  }, [locationData, mediaData, selectedLocationId]);

  const scrollToTop = () => {
    if (sectionTopRef.current) {
      sectionTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabClick = (tab: TabView) => {
    if (activeTab === tab) {
      // If clicking the currently active tab (which says "Return" if something is selected),
      // we reset the selection. If nothing is selected, we close the accordion tab.
      if (tab === 'map' && selectedLocationId) {
        setSelectedLocationId(null);
        window.history.pushState({}, '', window.location.pathname);
      } else if (tab === 'list' && selectedLocationId) {
        setSelectedLocationId(null);
        window.history.pushState({}, '', window.location.pathname);
      } else if (tab === 'field-notes' && selectedNoteId !== null) {
        setSelectedNoteId(null);
      } else {
        // Close the tab entirely if nothing inside was selected
        setActiveTab(null);
      }
      scrollToTop();
    } else {
      // Changing tabs (open accordion)
      setActiveTab(tab);
    }
  };

  const allMedia = useMemo(() => {
    if (!mediaData.length) return [];

    const grouped: Record<string, { checklistId: string, date: string, time: string, location: string, items: EbirdMediaObservation[] }> = {};
    for (const m of mediaData) {
        if (!grouped[m.eBirdChecklistID]) {
             grouped[m.eBirdChecklistID] = {
                 checklistId: m.eBirdChecklistID,
                 date: m.Date,
                 time: m.Time,
                 location: m.Locality,
                 items: []
             };
        }
        grouped[m.eBirdChecklistID].items.push(m);
    }

    return Object.values(grouped).sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        return b.time.localeCompare(a.time);
    });
  }, [mediaData]);

  // Scroll to selected item when it changes
  useEffect(() => {
    if (selectedLocationId && locationRefs.current[selectedLocationId]) {
      // setTimeout to allow render before scrolling
      setTimeout(() => {
         locationRefs.current[selectedLocationId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedLocationId]);

  const selectLocation = (id: string | null) => {
    setSelectedLocationId(id);
    const newUrl = id ? `?locationId=${id}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="flex flex-col space-y-8 bg-white" ref={sectionTopRef}>
      <AccordionSection
        label={activeTab === 'map' && selectedLocationId ? 'Return' : 'Map'}
        isOpen={activeTab === 'map'}
        onToggle={() => handleTabClick('map')}
      >
        {/* Top Section: Map */}
        <div className="w-full relative h-[500px] lg:h-[600px] mb-8 border border-gray-300">
          <MapView
            data={data}
            selectedLocationId={selectedLocationId}
            onLocationSelect={(id) => {
              selectLocation(id);
              if (id) {
                setTimeout(() => {
                  locationRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }
            }}
          />
        </div>

        {/* If a location is selected in map view, show its details below */}
        {selectedLocation && (
          <div className="flex-1 space-y-4 mt-8">
            <div
              key={selectedLocation.id}
              ref={(el) => { locationRefs.current[selectedLocation.id] = el; }}
              className="border border-black bg-white"
            >
              <LocationDetailPanel
                location={selectedLocation}
                checklists={locationChecklists}
                totals={overallTotals}
                chartData={barChartData}
                chartColor={CHART_COLORS[0]}
                onMediaSelect={openMedia}
              />
            </div>
          </div>
        )}
      </AccordionSection>

      <AccordionSection
        label={activeTab === 'list' && selectedLocationId ? 'Return' : 'Lists'}
        isOpen={activeTab === 'list'}
        onToggle={() => handleTabClick('list')}
      >
        <div className="relative mb-4">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter locations by name..."
            aria-label="Filter locations by name"
            className="w-full border border-black bg-white pl-9 pr-3 py-2 font-mono text-sm placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
          />
        </div>
        <div ref={listRef} className="flex-1 space-y-4">
          {filteredLocations.length === 0 && (
            <p className="font-mono text-gray-500 italic">No locations match &ldquo;{locationFilter}&rdquo;.</p>
          )}
          {filteredLocations.map((loc) => {
            const isSelected = selectedLocationId === loc.id;

            return (
              <div
                key={loc.id}
                ref={(el) => {
                  locationRefs.current[loc.id] = el;
                }}
                className={`border border-black ${isSelected ? 'border-2' : ''}`}
              >
                <button
                  onClick={() => selectLocation(isSelected ? null : loc.id)}
                  aria-expanded={isSelected}
                  className={`w-full text-left p-4 font-mono text-sm transition-colors ${isSelected ? 'bg-black text-white' : 'bg-white text-[var(--accent)]'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base md:text-lg">{loc.name}</span>
                  </div>
                </button>

                {isSelected && (
                  <div className="border-t border-black">
                    <LocationDetailPanel
                      location={loc}
                      checklists={locationChecklists}
                      totals={overallTotals}
                      chartData={barChartData}
                      chartColor={CHART_COLORS[0]}
                      media={locationMedia}
                      onMediaSelect={openMedia}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AccordionSection>

      <AccordionSection label="Media" isOpen={activeTab === 'media'} onToggle={() => handleTabClick('media')} contentClassName="min-h-[500px]">
        <div className="flex-1 space-y-8">
          {allMedia.map((group) => (
            <Panel key={group.checklistId} className="p-4 md:p-6">
              <div className="flex flex-row items-center justify-between mb-4 border-b border-black pb-2">
                <div className="font-bold text-base md:text-lg font-serif">{group.location}</div>
                <div className="font-mono text-sm flex items-center space-x-4">
                  <span>{group.date} {group.time}</span>
                  <Link href={`/checklist/${group.checklistId}`} className="hover:underline text-[var(--accent)]">
                    Checklist
                  </Link>
                </div>
              </div>
              <MediaGrid items={group.items} onSelect={(idx) => openMedia(group.items, idx)} />
            </Panel>
          ))}
          {allMedia.length === 0 && <EmptyState>No media available.</EmptyState>}
        </div>
      </AccordionSection>

      <AccordionSection
        label={activeTab === 'field-notes' && selectedNoteId !== null ? 'Return' : 'Notes'}
        isOpen={activeTab === 'field-notes'}
        onToggle={() => handleTabClick('field-notes')}
        contentClassName="min-h-[500px]"
      >
        <div className="flex-1 space-y-4">
          {fieldNotes.length > 0 ? fieldNotes.map((note) => {
            const isSelected = selectedNoteId === note.id;

            return (
              <div key={note.id} className={`border border-black ${isSelected ? 'border-2' : ''}`}>
                <button
                  onClick={() => {
                    if (isSelected) {
                      setSelectedNoteId(null);
                    } else {
                      setSelectedNoteId(note.id);
                      setTimeout(() => {
                         scrollToTop();
                      }, 50);
                    }
                  }}
                  aria-expanded={isSelected}
                  className={`w-full text-left p-4 font-mono text-sm transition-colors ${isSelected ? 'bg-black text-white' : 'bg-white text-[var(--accent)]'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base md:text-lg">{note.title}</span>
                    <span>{note.date}</span>
                  </div>
                </button>

                {isSelected && (
                  <div className="p-4 md:p-8 border-t border-black bg-white text-black">
                    {/* Meta Information */}
                    <div className="mb-8 flex flex-col gap-4 font-mono text-sm border-b border-black pb-4">
                      <div>
                         <span className="font-bold">Date:</span> {note.date}
                      </div>
                      {note.location && (
                        <div>
                          <span className="font-bold">Location:</span> {note.location}
                        </div>
                      )}
                      {note.conditions && (
                        <div>
                          <span className="font-bold">Conditions:</span> {note.conditions}
                        </div>
                      )}
                      {note.links && note.links.length > 0 && (
                        <div>
                          <span className="font-bold">Links:</span>
                          <ul className="list-disc list-inside mt-1">
                            {note.links.map((link, i) => (
                              <li key={i}>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 underline text-[var(--accent)]">
                                  {link}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="prose prose-p:font-serif prose-headings:font-serif prose-a:text-[var(--accent)] max-w-none">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                         {note.content}
                       </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <EmptyState>No field notes available. Create markdown files in the field-notes directory.</EmptyState>
          )}
        </div>
      </AccordionSection>

      <AccordionSection label="About" isOpen={activeTab === 'about'} onToggle={() => handleTabClick('about')} contentClassName="min-h-[500px]">
        <Panel className="p-4 md:p-8">
          <section className="space-y-6 text-lg font-serif">
            <p>
              This project is built and maintained by Felipe. Resources and additional information are available below. Thank you.
            </p>

            <ul className="list-disc list-inside space-y-4 ml-4">
              <li>
                <a
                  href="https://github.com/felipeharker/hark-ornithology"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-mono text-[var(--accent)]"
                >
                  Github Repository
                </a>
                <p className="mt-1">
                  See underlying project codebase, contribute your own ideas, and host this site locally.
                </p>
              </li>
              <li>
                <a
                  href="https://ebird.org/profile/ODE0ODA5NQ/world"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-mono text-[var(--accent)]"
                >
                  eBird Account
                </a>
                <p className="mt-1">
                  All checklists, locations, observations, and more can also be seen on eBird.
                </p>
              </li>
              <li>
                <a
                  href="https://media.ebird.org/catalog?unconfirmed=incl&mediaType=photo&userId=USER8148095"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-mono text-[var(--accent)]"
                >
                  Macaulay Library
                </a>
                  <p className="mt-1">
                    Media such as images, audio, and video recordings are cataloged on Macaulay Library.
                  </p>
              </li>
              <li>
                <a
                  href="https://merlin.allaboutbirds.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-mono text-[var(--accent)]"
                >
                  Merlin Bird ID
                </a>
                <p className="mt-1">
                  State-of-the-art visual and audio bird identification mobile app. Invaluable resource for any birder.
                </p>
              </li>
            </ul>
          </section>
        </Panel>
      </AccordionSection>

      {lightboxIndex !== null && (
         <ImageLightbox
           mediaList={currentMediaList}
           initialIndex={lightboxIndex}
           onClose={() => setLightboxIndex(null)}
         />
      )}
    </div>
  );
}

export default function LocationDashboard({ data, mediaData = [], fieldNotes = [], options }: LocationDashboardProps) {
  return (
    <Suspense fallback={<EmptyState className="animate-pulse">Loading data...</EmptyState>}>
      <LocationDashboardInner data={data} mediaData={mediaData} fieldNotes={fieldNotes} options={options} />
    </Suspense>
  );
}
