"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import Map, { Marker, MapRef, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EbirdObservation } from '../lib/parseEbirdData';

interface MapViewProps {
  data: EbirdObservation[];
  resetTrigger?: number;
}

interface LocationGroup {
  id: string;
  location: string;
  county: string;
  stateProvince: string;
  latitude: number;
  longitude: number;
  observations: EbirdObservation[];
}

interface SpeciesTotal {
  commonName: string;
  scientificName: string;
  total: number;
  onlyX: boolean;
}

interface ChecklistSummary {
  submissionId: string;
  locationId: string;
  location: string;
  date: string;
  time: string;
  groupId: string; // To link to the LocationGroup
}

export default function MapView({ data, resetTrigger = 0 }: MapViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationGroup | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<boolean>(false);
  const [locationsMode, setLocationsMode] = useState<boolean>(true);
  const mapRef = useRef<MapRef>(null);
  const [lastReset, setLastReset] = useState<number>(0);

  if (resetTrigger !== lastReset) {
    setLastReset(resetTrigger);
    setSelectedLocation(null);
  }

  useEffect(() => {
    if (resetTrigger > 0 && selectedLocation === null && mapRef.current) {
        mapRef.current.flyTo({
          center: [-95.0, 38.0],
          zoom: 3,
          duration: 2000
        });
    }
  }, [resetTrigger, selectedLocation]);

  const locationGroups = useMemo(() => {
    const groups: Record<string, LocationGroup> = {};
    for (const obs of data) {
      const key = obs.LocationID || `${obs.Latitude},${obs.Longitude}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          location: obs.Location,
          county: obs.County,
          stateProvince: obs.StateProvince,
          latitude: obs.Latitude,
          longitude: obs.Longitude,
          observations: []
        };
      }
      groups[key].observations.push(obs);
    }
    return Object.values(groups);
  }, [data]);

  // We need an array of stable colors mapped to the recent checklists to avoid re-rendering
  const randomColors = useMemo(() => {
    const palette = ['#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600'];
    const colors: string[] = [];
    let lastColorIndex = -1;

    // A simple pseudo-random number generator to replace Math.random() in render
    // Use an object to hold the seed so it can be mutated without react-hooks/immutability complaining
    const seedState = { value: 54321 };
    const pseudoRandom = () => {
      seedState.value = (seedState.value * 9301 + 49297) % 233280;
      return seedState.value / 233280;
    };

    // Create an array large enough for the recent checklists (10)
    for (let i = 0; i < 20; i++) {
      let nextColorIndex;
      do {
        nextColorIndex = Math.floor(pseudoRandom() * palette.length);
      } while (nextColorIndex === lastColorIndex && palette.length > 1);

      colors.push(palette[nextColorIndex]);
      lastColorIndex = nextColorIndex;
    }
    return colors;
  }, []);

  const recentChecklists = useMemo(() => {
    // Group by SubmissionID to get unique checklists
    const checklistsMap: Record<string, ChecklistSummary> = {};
    for (const obs of data) {
      if (obs.SubmissionID && !checklistsMap[obs.SubmissionID]) {
        const groupId = obs.LocationID || `${obs.Latitude},${obs.Longitude}`;
        checklistsMap[obs.SubmissionID] = {
          submissionId: obs.SubmissionID,
          locationId: obs.LocationID,
          location: obs.Location,
          date: obs.Date,
          time: obs.Time,
          groupId: groupId
        };
      }
    }

    // Convert to array and sort by Date (descending)
    return Object.values(checklistsMap).sort((a, b) => {
      // Compare by date first
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) return dateComparison;
      // If dates are equal, compare by time
      return b.time.localeCompare(a.time);
    }).slice(0, 10); // keep only top 10 most recent
  }, [data]);

  const { overallTotals, monthlyTotals } = useMemo(() => {
    if (!selectedLocation) return { overallTotals: [], monthlyTotals: {} };

    const calculateTotals = (observations: EbirdObservation[]) => {
      const speciesMap = new globalThis.Map<string, { sci: string, total: number, hasNumeric: boolean }>();

      for (const obs of observations) {
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

      const totals: SpeciesTotal[] = Array.from(speciesMap.entries()).map(([name, data]) => ({
        commonName: name,
        scientificName: data.sci,
        total: data.total,
        onlyX: !data.hasNumeric
      }));

      // Sort: Numbers first (descending total), then 'X' only (alphabetical)
      return totals.sort((a, b) => {
        if (a.onlyX && !b.onlyX) return 1;
        if (!a.onlyX && b.onlyX) return -1;
        if (!a.onlyX && !b.onlyX) return b.total - a.total;
        return a.commonName.localeCompare(b.commonName);
      });
    };

    const overallTotals = calculateTotals(selectedLocation.observations);

    const monthlyMap: Record<string, EbirdObservation[]> = {};
    for (const obs of selectedLocation.observations) {
      // Date is expected to be YYYY-MM-DD
      const dateParts = obs.Date.split('-');
      if (dateParts.length >= 2) {
        const monthYear = `${dateParts[0]}-${dateParts[1]}`;
        if (!monthlyMap[monthYear]) {
          monthlyMap[monthYear] = [];
        }
        monthlyMap[monthYear].push(obs);
      }
    }

    const monthlyTotals: Record<string, SpeciesTotal[]> = {};
    const sortedMonths = Object.keys(monthlyMap).sort((a, b) => b.localeCompare(a));
    for (const month of sortedMonths) {
      monthlyTotals[month] = calculateTotals(monthlyMap[month]);
    }

    return { overallTotals, monthlyTotals };
  }, [selectedLocation]);

  const handleChecklistClick = (groupId: string) => {
    const group = locationGroups.find(g => g.id === groupId);
    if (group) {
      setSelectedLocation(group);
    }
  };

  const toggleMode = (mode: 'heatmap' | 'locations') => {
    if (mode === 'heatmap') {
      if (heatmapMode && !locationsMode) return; // Prevent turning off both
      setHeatmapMode(!heatmapMode);
    } else {
      if (locationsMode && !heatmapMode) return; // Prevent turning off both
      setLocationsMode(!locationsMode);
    }
  };

  const heatmapGeoJSON = useMemo(() => {
    if (!heatmapMode) return null;

    return {
      type: 'FeatureCollection' as const,
      features: locationGroups.map(group => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [group.longitude, group.latitude]
        },
        properties: {
          count: group.observations.length
        }
      }))
    };
  }, [locationGroups, heatmapMode]);

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: 12,
        duration: 2000
      });
    }
  }, [selectedLocation]);

  return (
    <div className={`flex flex-col ${selectedLocation ? 'lg:flex-row lg:space-x-6' : 'lg:flex-row lg:space-x-6'} space-y-6 lg:space-y-0 relative`}>
      <div className={`w-full ${selectedLocation ? 'h-[500px] lg:h-[800px] lg:w-2/3' : 'h-[600px] md:h-[800px] lg:w-3/4'} border border-black relative`}>
        {!selectedLocation && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => toggleMode('locations')}
                className={`px-3 py-1 font-mono text-sm border border-black transition-colors ${locationsMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
              >
                Locations
              </button>
              <button
                onClick={() => toggleMode('heatmap')}
                className={`px-3 py-1 font-mono text-sm border border-black transition-colors ${heatmapMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
              >
                Heatmap
              </button>
            </div>
            {heatmapMode && (
              <div className="bg-white border border-black p-2 font-mono text-xs w-48 mt-2">
                <div className="mb-1">Heatmap Density</div>
                <div className="h-3 w-full" style={{ background: 'linear-gradient(to right, rgba(0, 63, 92, 0), #58508d, #bc5090, #ff6361, #ffa600)' }}></div>
                <div className="flex justify-between mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}
          </div>
        )}
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: -95.0,
            latitude: 38.0,
            zoom: 3
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        >
          {heatmapMode && heatmapGeoJSON && (
            <Source type="geojson" data={heatmapGeoJSON}>
              <Layer
                id="heatmap-layer"
                type="heatmap"
                paint={{
                  // Increase the heatmap weight based on frequency/count property
                  'heatmap-weight': [
                    'interpolate',
                    ['linear'],
                    ['get', 'count'],
                    0, 0,
                    100, 1
                  ],
                  // Increase the heatmap color weight weight by zoom level
                  // heatmap-intensity is a multiplier on top of heatmap-weight
                  'heatmap-intensity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0, 1,
                    9, 3
                  ],
                  // Color palette from user spec
                  'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0, 'rgba(0, 63, 92, 0)',      // #003f5c (transparent start)
                    0.2, '#58508d',
                    0.4, '#bc5090',
                    0.6, '#ff6361',
                    0.8, '#ffa600',
                    1, '#ffa600'
                  ],
                  // Adjust the heatmap radius by zoom level
                  'heatmap-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0, 10,
                    9, 30
                  ],
                  // Transition from heatmap to circle layer by zoom level
                  'heatmap-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    7, 1,
                    9, 0.5
                  ]
                }}
              />
            </Source>
          )}

          {locationsMode && locationGroups.map((group) => {
            const isSelected = selectedLocation?.id === group.id;
            const bothModes = locationsMode && heatmapMode;
            const markerColorClass = bothModes ? 'text-white hover:text-gray-200' : 'text-orange-500 hover:text-orange-700';

            return (
              <Marker
                key={group.id}
                longitude={group.longitude}
                latitude={group.latitude}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedLocation(group);
                }}
              >
                <div className={`cursor-pointer transition-colors ${isSelected ? 'text-blue-500 hover:text-blue-700 z-10 relative scale-110' : markerColorClass}`}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="3" fill={bothModes ? "black" : "white"} />
                  </svg>
                </div>
              </Marker>
            );
          })}
        </Map>
      </div>

      {selectedLocation ? (
        <div className="w-full lg:w-1/3 bg-white p-4 md:p-6 border border-black space-y-6 md:space-y-8 overflow-y-auto lg:max-h-[800px]">
          <header className="border-b border-black pb-4">
            <h2 className="text-xl md:text-2xl font-bold tracking-wider">{selectedLocation.location}</h2>
            <p className="text-sm md:text-base font-mono mt-1 text-gray-700">{selectedLocation.county}, {selectedLocation.stateProvince}</p>
          </header>

          <section>
            <h3 className="text-base md:text-lg font-bold tracking-wider mb-3">Table 1. Overall Species Totals</h3>
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
          </section>

          <section>
            <h3 className="text-base md:text-lg font-bold tracking-wider mb-3">Table 2. Monthly Breakdown</h3>
            {Object.entries(monthlyTotals).length === 0 ? (
              <p className="font-mono text-gray-500 italic">No dates available to group by month.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(monthlyTotals).map(([monthYear, totals]) => (
                  <div key={monthYear} className="border-t border-b border-black">
                    <div className="bg-gray-100 px-2 py-2 border-b border-black font-bold font-mono text-sm">
                      {monthYear}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-300 text-sm font-mono">
                        <tbody className="divide-y divide-gray-300">
                          {totals.map(item => (
                            <tr key={item.commonName}>
                              <td className="px-2 py-2 whitespace-nowrap w-2/3">
                                <div className="font-bold">{item.commonName}</div>
                                <div className="text-xs italic text-gray-600">{item.scientificName}</div>
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap w-1/3 text-right font-bold">
                                {item.onlyX ? 'X' : item.total}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="w-full lg:w-1/4 bg-white p-4 md:p-6 border border-black space-y-6 overflow-y-auto lg:max-h-[800px]">
          <header className="border-b border-black pb-4">
            <h2 className="text-xl font-bold tracking-wider">Recent Activity</h2>
            <p className="text-sm font-mono mt-1 text-gray-600">Latest 10 Checklists</p>
          </header>

          <div className="space-y-4">
            {recentChecklists.length > 0 ? (
              recentChecklists.map((checklist, idx) => {
                const baseColor = randomColors[idx % randomColors.length];
                const hex2rgb = (hex: string) => {
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  return `${r}, ${g}, ${b}`;
                };
                const rgbColor = hex2rgb(baseColor);

                return (
                  <div
                    key={checklist.submissionId}
                    className="border border-gray-300 p-3 cursor-pointer transition-colors"
                    style={{ backgroundColor: 'white' }}
                    onClick={() => handleChecklistClick(checklist.groupId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `rgba(${rgbColor}, 0.2)`;
                      e.currentTarget.style.borderColor = 'black';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#d1d5db'; // gray-300
                    }}
                  >
                    <div className="font-mono text-sm font-bold text-black mb-1">{checklist.date} {checklist.time}</div>
                    <div className="font-serif text-sm text-gray-800 line-clamp-2">{checklist.location}</div>
                  </div>
                );
              })
            ) : (
              <p className="font-mono text-gray-500 italic">No recent checklists available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
