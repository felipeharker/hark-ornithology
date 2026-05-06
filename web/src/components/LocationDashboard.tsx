'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';
import ImageLightbox from './ImageLightbox';
import MapView from './Map';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LocationDashboardProps {
  data: EbirdObservation[];
  mediaData?: EbirdMediaObservation[];
  options: {
    title: string;
    secondaryColorHex: string;
    dataFileName: string;
  };
}

function LocationDashboardInner({ data, mediaData = [], options }: LocationDashboardProps) {
  const secondaryColor = options.secondaryColorHex || '#ff6361';
  // Avoid duplicating colors if secondary is the same as the default chart color
  const CHART_COLORS = ['#003f5c', secondaryColor, '#bc5090', '#ffa600', '#58508d'];
  const searchParams = useSearchParams();
  const initialLocationId = searchParams.get('locationId');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(initialLocationId);
  const [viewMode, setViewMode] = useState<'locations' | 'media'>('locations');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentMediaList, setCurrentMediaList] = useState<EbirdMediaObservation[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const locationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  return (
    <div className="flex flex-col bg-white">
      {/* Top Section: Map */}
      <div className="w-full relative h-[500px] lg:h-[600px] mb-8">
        <MapView
          data={data}
          selectedLocationId={selectedLocationId}
          options={options}
          onLocationSelect={(id) => {
            setSelectedLocationId(id);
            // Update URL to match state
            const newUrl = id ? `?locationId=${id}` : window.location.pathname;
            window.history.pushState({}, '', newUrl);
          }}
        />
      </div>

      {/* Bottom Section: Locations List */}
      <div className="w-full flex flex-col bg-white">
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          {selectedLocationId && (
            <button
              onClick={() => {
                setSelectedLocationId(null);
                window.history.pushState({}, '', window.location.pathname);
              }}
              className="w-full md:w-auto text-left p-3 border border-black font-mono text-sm transition-colors hover:bg-gray-100 bg-white text-black"
            >
              Clear Selection
            </button>
          )}
          <button
            onClick={() => setViewMode(viewMode === 'locations' ? 'media' : 'locations')}
            className="w-full md:w-auto text-left p-3 border border-black font-mono text-sm transition-colors hover:bg-gray-100 bg-gray-100 text-black"
          >
            {viewMode === 'locations' ? 'Media View' : 'List View'}
          </button>
        </div>

        {viewMode === 'locations' || selectedLocationId ? (
          <div ref={listRef} className="flex-1 space-y-4">
            {locations.map((loc) => {
              const isSelected = selectedLocationId === loc.id;

            let textColorClass = 'text-black';
            let bgColorClass = 'bg-white';
            let inlineStyle = {};

            if (isSelected) {
              bgColorClass = 'bg-black';
              textColorClass = 'text-white';
            } else {
              inlineStyle = { color: secondaryColor };
            }

            return (
              <div
                key={loc.id}
                ref={(el) => {
                  locationRefs.current[loc.id] = el;
                }}
                className={`border border-black ${isSelected ? 'border-2' : ''}`}
              >
                <button
                  onClick={() => {
                    const newId = isSelected ? null : loc.id;
                    setSelectedLocationId(newId);
                    const newUrl = newId ? `?locationId=${newId}` : window.location.pathname;
                    window.history.pushState({}, '', newUrl);
                  }}
                  className={`w-full text-left p-4 font-mono text-sm transition-colors ${bgColorClass} ${textColorClass}`}
                  style={inlineStyle}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base md:text-lg">{loc.name}</span>
                    <span>{loc.count} obs</span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="p-4 md:p-8 border-t border-black bg-white text-black">
                    {viewMode === 'locations' ? (
                      <>
                    {/* Checklists */}
                    <div className="mb-12">
                      <h3 className="text-xl font-bold mb-4 font-serif border-b border-black pb-2">Checklists</h3>
                      {locationChecklists.length > 0 ? (
                        <div className="space-y-2">
                           {locationChecklists.map(checklist => (
                             <div key={checklist.submissionId} className="flex flex-row items-center border border-gray-300 p-3 hover:bg-gray-50 transition-colors">
                               <div className="font-mono text-sm mr-4 w-40">{checklist.date} {checklist.time}</div>
                               <Link
                                 href={`/checklist/${checklist.submissionId}?locationId=${loc.id}`}
                                 className="font-mono text-sm hover:opacity-80 underline"
                                 style={{ color: secondaryColor }}
                               >
                                 {checklist.hasMedia ? "View Checklist and Media" : "View Checklist"}
                               </Link>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <p className="font-mono text-gray-500 italic">No checklists available.</p>
                      )}
                    </div>

                    {/* Species Total Table */}
                    <div className="mb-12">
                      <h3 className="text-xl font-bold mb-4 font-serif border-b border-black pb-2">Species Totals</h3>
                      <div className="overflow-x-auto border-t border-b border-black">
                        <table className="min-w-full divide-y divide-black text-sm font-mono">
                          <thead>
                            <tr>
                              <th className="px-2 py-3 text-left font-bold">Species</th>
                              <th className="px-2 py-3 text-right font-bold">Count</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-300">
                            {overallTotals.map(item => (
                              <tr key={item.commonName}>
                                <td className="px-2 py-2 whitespace-nowrap">
                                  <div className="font-bold">{item.commonName}</div>
                                  <div className="text-xs italic text-gray-600">{item.scientificName}</div>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-right font-bold">
                                  {item.onlyX ? 'X' : item.total}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                      </>
                    ) : (
                    <div className="mb-12">
                      {/* Media from Location */}
                      <h3 className="text-xl font-bold mb-4 font-serif border-b border-black pb-2">Media</h3>
                      {locationMedia.length > 0 ? (
                        <div className="space-y-8">
                           {locationMedia.map(group => (
                             <div key={group.checklistId} className="border border-gray-300 p-4">
                               <div className="flex flex-row items-center justify-between mb-4 border-b border-gray-200 pb-2">
                                 <div className="font-mono text-sm font-bold">{group.date} {group.time}</div>
                                 <Link
                                   href={`/checklist/${group.checklistId}?locationId=${loc.id}`}
                                   className="font-mono text-sm hover:opacity-80 underline"
                                   style={{ color: secondaryColor }}
                                 >
                                   View Checklist
                                 </Link>
                               </div>
                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                 {group.items.map((m, idx) => (
                                    <div key={m.MLCatalogNumber} className="cursor-pointer border border-gray-200 hover:border-black transition-colors"
                                      onClick={() => {
                                        setCurrentMediaList(group.items);
                                        setLightboxIndex(idx);
                                      }}
                                    >
                                       <div className="aspect-square bg-gray-100 overflow-hidden relative">
                                         <img
                                           src={`https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${m.MLCatalogNumber}/1200`}
                                           alt={m.CommonName}
                                           className="object-cover w-full h-full"
                                           loading="lazy"
                                         />
                                       </div>
                                       <div className="p-2 text-xs font-mono bg-white text-black truncate">
                                          {m.CommonName}
                                       </div>
                                    </div>
                                 ))}
                               </div>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <p className="font-mono text-gray-500 italic">No media available for this location.</p>
                      )}
                    </div>
                    )}

                    {/* Line Chart */}
                    <div>
                      <h3 className="text-xl font-bold mb-4 font-serif border-b border-black pb-2">Observations over Time (Month/Year)</h3>
                      <div className="h-[400px] md:h-[500px] border border-black p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="date" tick={{fontFamily: 'monospace', fontSize: 12}} />
                            <YAxis allowDecimals={false} tick={{fontFamily: 'monospace', fontSize: 12}} />
                            <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid black', fontFamily: 'monospace' }} />
                            <Line type="monotone" dataKey="count" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 space-y-8">
            {allMedia.map((group) => (
              <div key={group.checklistId} className="border border-black bg-white p-4">
                <div className="flex flex-row items-center justify-between mb-4 border-b border-black pb-2">
                  <div className="font-bold text-base md:text-lg">{group.location}</div>
                  <div className="font-mono text-sm flex items-center space-x-4">
                    <span>{group.date} {group.time}</span>
                    <Link
                      href={`/checklist/${group.checklistId}`}
                      className="hover:opacity-80 underline"
                      style={{ color: secondaryColor }}
                    >
                      View Checklist
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {group.items.map((m, idx) => (
                    <div key={m.MLCatalogNumber} className="cursor-pointer border border-gray-200 hover:border-black transition-colors"
                      onClick={() => {
                        setCurrentMediaList(group.items);
                        setLightboxIndex(idx);
                      }}
                    >
                        <div className="aspect-square bg-gray-100 overflow-hidden relative">
                          <img
                            src={`https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${m.MLCatalogNumber}/1200`}
                            alt={m.CommonName}
                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-2 text-xs font-mono bg-white text-black truncate">
                          {m.CommonName}
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {allMedia.length === 0 && (
                <div className="p-8 border border-black text-center font-mono text-gray-500">
                    No media available.
                </div>
            )}
          </div>
        )}
      </div>

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

export default function LocationDashboard({ data, mediaData = [], options }: LocationDashboardProps) {
  return (
    <Suspense fallback={<div className="font-mono">Loading data...</div>}>
      <LocationDashboardInner data={data} mediaData={mediaData} options={options} />
    </Suspense>
  );
}
