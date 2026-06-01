'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';
import { FieldNote } from '@/lib/parseFieldNotes';
import ImageLightbox from './ImageLightbox';
import MapView from './Map';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [activeTab, setActiveTab] = useState<TabView>(initialLocationId ? 'list' : 'map');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentMediaList, setCurrentMediaList] = useState<EbirdMediaObservation[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const locationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const sectionTopRef = useRef<HTMLDivElement>(null);

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

  const scrollToTop = () => {
    if (sectionTopRef.current) {
      sectionTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabClick = (tab: TabView) => {
    if (activeTab === tab) {
      // If clicking the currently active tab (which says "Return" if something is selected),
      // we reset the selection and scroll up.
      if (tab === 'map' && selectedLocationId) {
        setSelectedLocationId(null);
        window.history.pushState({}, '', window.location.pathname);
        scrollToTop();
      } else if (tab === 'list' && selectedLocationId) {
        setSelectedLocationId(null);
        window.history.pushState({}, '', window.location.pathname);
        scrollToTop();
      } else if (tab === 'field-notes' && selectedNoteId !== null) {
        setSelectedNoteId(null);
        scrollToTop();
      }
    } else {
      // Changing tabs
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

  return (
    <div className="flex flex-col bg-white" ref={sectionTopRef}>
      {/* Tabs */}
      <div className="flex flex-row mb-8 w-full md:w-fit divide-x divide-gray-300">
        <button
          onClick={() => handleTabClick('map')}
          className={`flex-1 md:flex-none w-full md:w-36 lg:w-40 text-center font-bold tracking-tighter md:tracking-wider py-2 md:py-4 px-1 md:px-0 whitespace-nowrap transition-colors ${activeTab === 'map' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'} font-mono text-[10px] sm:text-xs md:text-base`}
        >
          {activeTab === 'map' && selectedLocationId ? 'Return' : 'Map View'}
        </button>
        <button
          onClick={() => handleTabClick('list')}
          className={`flex-1 md:flex-none w-full md:w-36 lg:w-40 text-center font-bold tracking-tighter md:tracking-wider py-2 md:py-4 px-1 md:px-0 whitespace-nowrap transition-colors ${activeTab === 'list' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'} font-mono text-[10px] sm:text-xs md:text-base`}
        >
          {activeTab === 'list' && selectedLocationId ? 'Return' : 'List View'}
        </button>
        <button
          onClick={() => handleTabClick('media')}
          className={`flex-1 md:flex-none w-full md:w-36 lg:w-40 text-center font-bold tracking-tighter md:tracking-wider py-2 md:py-4 px-1 md:px-0 whitespace-nowrap transition-colors ${activeTab === 'media' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'} font-mono text-[10px] sm:text-xs md:text-base`}
        >
          Media View
        </button>
        <button
          onClick={() => handleTabClick('field-notes')}
          className={`flex-1 md:flex-none w-full md:w-36 lg:w-40 text-center font-bold tracking-tighter md:tracking-wider py-2 md:py-4 px-1 md:px-0 whitespace-nowrap transition-colors ${activeTab === 'field-notes' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'} font-mono text-[10px] sm:text-xs md:text-base`}
        >
          {activeTab === 'field-notes' && selectedNoteId !== null ? 'Return' : 'Field Notes'}
        </button>
        <button
          onClick={() => handleTabClick('about')}
          className={`flex-1 md:flex-none w-full md:w-36 lg:w-40 text-center font-bold tracking-tighter md:tracking-wider py-2 md:py-4 px-1 md:px-0 whitespace-nowrap transition-colors ${activeTab === 'about' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'} font-mono text-[10px] sm:text-xs md:text-base`}
        >
          About
        </button>
      </div>

      {activeTab === 'map' && (
        <div className="flex flex-col w-full">
          {/* Top Section: Map */}
          <div className="w-full relative h-[500px] lg:h-[600px] mb-8 border border-gray-300">
            <MapView
              data={data}
              selectedLocationId={selectedLocationId}
              options={options}
              onLocationSelect={(id) => {
                setSelectedLocationId(id);
                // Update URL to match state
                const newUrl = id ? `?locationId=${id}` : window.location.pathname;
                window.history.pushState({}, '', newUrl);

                if (id) {
                  setTimeout(() => {
                    if (locationRefs.current[id]) {
                      locationRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
            />
          </div>

          {/* If a location is selected in map view, show its details below */}
          {selectedLocationId && (
            <div className="flex-1 space-y-4 mt-8">
              {locations.filter((loc) => loc.id === selectedLocationId).map((loc) => {
                const textColorClass = 'text-black';

                const getLocationChecklists = () => {
                    const chkMap = new Map<string, { submissionId: string; date: string; time: string; hasMedia: boolean }>();
                    data.forEach((obs) => {
                      if (obs.LocationID === loc.id) {
                         if (!chkMap.has(obs.SubmissionID)) {
                            chkMap.set(obs.SubmissionID, {
                               submissionId: obs.SubmissionID,
                               date: obs.Date || '',
                               time: obs.Time || '',
                               hasMedia: false
                            });
                         }
                         if (obs.MLCatalogNumbers) {
                            chkMap.get(obs.SubmissionID)!.hasMedia = true;
                         }
                      }
                    });
                    const arr = Array.from(chkMap.values());
                    arr.sort((a, b) => {
                       const dateA = a.date + ' ' + a.time;
                       const dateB = b.date + ' ' + b.time;
                       return dateB.localeCompare(dateA);
                    });
                    return arr;
                };

                const getOverallTotals = () => {
                  const speciesMap = new Map<string, { commonName: string, scientificName: string, total: number, onlyX: boolean }>();
                  data.forEach((obs) => {
                    if (obs.LocationID === loc.id) {
                      const key = obs.CommonName;
                      if (!speciesMap.has(key)) {
                        speciesMap.set(key, { commonName: key, scientificName: obs.ScientificName, total: 0, onlyX: true });
                      }
                      const entry = speciesMap.get(key)!;
                      if (obs.Count && obs.Count.toUpperCase() !== 'X') {
                        const count = parseInt(obs.Count, 10);
                        if (!isNaN(count)) {
                          entry.total += count;
                          entry.onlyX = false;
                        }
                      }
                    }
                  });
                  const arr = Array.from(speciesMap.values());
                  arr.sort((a, b) => {
                    if (a.onlyX && !b.onlyX) return 1;
                    if (!a.onlyX && b.onlyX) return -1;
                    if (!a.onlyX && !b.onlyX && b.total !== a.total) {
                      return b.total - a.total;
                    }
                    return a.commonName.localeCompare(b.commonName);
                  });
                  return arr;
                };

                const locationChecklistsList = getLocationChecklists();
                const overallTotalsList = getOverallTotals();

                return (
                  <div
                    key={loc.id}
                    ref={(el) => { locationRefs.current[loc.id] = el; }}
                    className="border border-black bg-white"
                  >
                    {/* Header */}
                    <div className={`p-4 md:p-6 transition-colors border-b border-black`}>
                      <div className="flex flex-row items-center justify-between">
                        <div className="flex-1">
                          <h2 className={`text-xl md:text-2xl font-bold font-serif ${textColorClass}`}>
                            {loc.name}
                          </h2>
                          <div className={`font-mono text-sm mt-1 opacity-80 ${textColorClass}`}>
                            {loc.count} {loc.count === 1 ? 'Observation' : 'Observations'}
                            {loc.isHotspot && ' • Hotspot'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <div className="p-4 md:p-8 bg-white text-black">
                      <div className="mb-12">
                        <h3 className="text-xl font-bold mb-4 font-serif border-b border-black pb-2">Checklists</h3>
                        {locationChecklistsList.length > 0 ? (
                          <div className="space-y-2">
                             {locationChecklistsList.map(checklist => (
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
                              {overallTotalsList.map(item => (
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="w-full flex flex-col bg-white">
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

                    {/* Media from Location */}
                    <div className="mb-12">
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
        </div>
      )}

      {activeTab === 'media' && (
        <div className="flex flex-col w-full min-h-[500px]">
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
        </div>
      )}

      {activeTab === 'field-notes' && (
        <div className="flex flex-col w-full min-h-[500px]">
          <div className="flex-1 space-y-4">
            {fieldNotes.length > 0 ? fieldNotes.map((note) => {
              const isSelected = selectedNoteId === note.id;
              // If another note is selected, hide the non-selected ones
              if (selectedNoteId !== null && !isSelected) return null;

              return (
                <div key={note.id} className="border border-black bg-white text-black">
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
                    className={`w-full text-left p-4 md:p-6 transition-colors ${isSelected ? 'bg-black' : 'hover:bg-gray-100'} outline-none`}
                  >
                     <div className="flex flex-col md:flex-row md:items-center justify-between">
                       <h2 className={`text-xl md:text-2xl font-bold font-serif ${isSelected ? 'text-white' : 'text-black'}`}>
                         {note.title}
                       </h2>
                       <div className={`font-mono text-sm mt-2 md:mt-0 ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                         {note.date} {note.location && `• ${note.location}`}
                       </div>
                     </div>
                  </button>

                  {isSelected && (
                    <div className="p-4 md:p-8 border-t border-black bg-white">
                      {/* Meta Information */}
                      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm border-b border-black pb-4">
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
                          <div className="md:col-span-2">
                            <span className="font-bold">Links:</span>
                            <ul className="list-disc list-inside mt-1">
                              {note.links.map((link, i) => (
                                <li key={i}>
                                  <a href={link} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 underline" style={{ color: secondaryColor }}>
                                    {link}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="prose prose-p:font-serif prose-headings:font-serif prose-a:text-[#ff6361] max-w-none">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
                           {note.content}
                         </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="p-8 border border-black text-center font-mono text-gray-500">
                No field notes available. Create markdown files in the field-notes directory.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="flex flex-col w-full min-h-[500px]">
          <div className="border border-black bg-white p-4 md:p-8">
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
                    style={{ color: secondaryColor }}
                    className="hover:underline font-mono"
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
                    style={{ color: secondaryColor }}
                    className="hover:underline font-mono"
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
                    style={{ color: secondaryColor }}
                    className="hover:underline font-mono"
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
                    style={{ color: secondaryColor }}
                    className="hover:underline font-mono"
                  >
                    Merlin Bird ID
                  </a>
                  <p className="mt-1">
                    State-of-the-art visual and audio bird identification mobile app. Invaluable resource for any birder.
                  </p>
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}

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
    <Suspense fallback={<div className="font-mono">Loading data...</div>}>
      <LocationDashboardInner data={data} mediaData={mediaData} fieldNotes={fieldNotes} options={options} />
    </Suspense>
  );
}
