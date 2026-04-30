'use client';

import React, { useState, useMemo } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import MapView from './Map';
import WorldMapGraphic from './WorldMapGraphic';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface LocationDashboardProps {
  data: EbirdObservation[];
}

const CHART_COLORS = ['#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600'];

export default function LocationDashboard({ data }: LocationDashboardProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  // We need an array of stable colors mapped to the locations to avoid re-rendering
  const randomColors = useMemo(() => {
    const palette = ['#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600'];
    const colors: string[] = [];
    let lastColorIndex = -1;

    // A simple pseudo-random number generator to replace Math.random() in render
    // Use an object to hold the seed so it can be mutated without react-hooks/immutability complaining
    const seedState = { value: 12345 };
    const pseudoRandom = () => {
      seedState.value = (seedState.value * 9301 + 49297) % 233280;
      return seedState.value / 233280;
    };

    // Create an array large enough for any number of locations
    for (let i = 0; i < 1000; i++) {
      let nextColorIndex;
      do {
        nextColorIndex = Math.floor(pseudoRandom() * palette.length);
      } while (nextColorIndex === lastColorIndex && palette.length > 1);

      colors.push(palette[nextColorIndex]);
      lastColorIndex = nextColorIndex;
    }
    return colors;
  }, []);

  const locations = useMemo(() => {
    const locMap = new Map<string, { id: string; name: string; count: number }>();
    data.forEach((obs) => {
      if (obs.LocationID) {
        if (!locMap.has(obs.LocationID)) {
          locMap.set(obs.LocationID, { id: obs.LocationID, name: obs.Location, count: 0 });
        }
        const entry = locMap.get(obs.LocationID)!;
        entry.count += 1;
      }
    });
    return Array.from(locMap.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  const locationData = useMemo(() => {
    if (!selectedLocationId) return [];
    return data.filter((obs) => obs.LocationID === selectedLocationId);
  }, [data, selectedLocationId]);

  const barChartData = useMemo(() => {
    if (!locationData.length || !data.length) return [];

    // Helper to extract YYYY-MM from date string
    const getYearMonth = (dateStr?: string) => {
      if (!dateStr) return null;
      const parts = dateStr.split(/[-/]/);
      if (parts.length >= 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          return `${parts[0]}-${parts[1].padStart(2, '0')}`;
        } else {
          // MM/DD/YYYY
          return `${parts[2]}-${parts[0].padStart(2, '0')}`;
        }
      }
      return null;
    };

    // Find the global min and max dates across the entire dataset
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

    // TypeScript narrowing
    const minDate: string = minDateStr;
    const maxDate: string = maxDateStr;

    // Generate all months between minDateStr and maxDateStr
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

    // Initialize all months with 0
    const monthlyCounts = new Map<string, number>();
    allMonths.forEach(m => monthlyCounts.set(m, 0));

    // Populate with actual data for the selected location
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

  const pieChartData = useMemo(() => {
    if (!locationData.length) return [];

    const speciesCounts = new Map<string, number>();
    locationData.forEach((obs) => {
      const name = obs.CommonName || 'Unknown';
      speciesCounts.set(name, (speciesCounts.get(name) || 0) + 1);
    });

    return Array.from(speciesCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort descending by count
  }, [locationData]);

  const selectedLocationData = useMemo(() => {
    return locations.find(l => l.id === selectedLocationId);
  }, [locations, selectedLocationId]);

  const selectedLocationName = selectedLocationData?.name;

  // Calculate coordinates for the selected location indicator
  const selectedLocationCoords = useMemo(() => {
    if (!selectedLocationData) return null;
    const obs = data.find(o => o.LocationID === selectedLocationId);
    if (!obs || obs.Latitude === undefined || obs.Longitude === undefined) return null;
    return { latitude: obs.Latitude, longitude: obs.Longitude };
  }, [selectedLocationData, selectedLocationId, data]);

  const selectedLocationColor = useMemo(() => {
    if (!selectedLocationData) return undefined;
    const idx = locations.findIndex(l => l.id === selectedLocationId);
    if (idx === -1) return undefined;
    return randomColors[idx % randomColors.length];
  }, [selectedLocationData, selectedLocationId, locations, randomColors]);

  return (
    <div className="flex flex-col md:flex-row min-h-[600px] bg-white">
      {/* Left Column: Locations List */}
      <div className="w-full md:w-72 flex flex-col bg-white">
        <div className="p-4 border border-black mb-4">
          <button
            onClick={() => {
              setSelectedLocationId(null);
              setResetTrigger(r => r + 1);
            }}
            className={`w-full text-left p-2 border border-black font-mono text-sm transition-colors hover:bg-black hover:text-white ${!selectedLocationId ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            All Locations / View Map
          </button>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-[600px] p-4 border border-black space-y-2">
          {locations.map((loc, idx) => {
            const isSelected = selectedLocationId === loc.id;
            const baseColor = randomColors[idx % randomColors.length];
            // Convert hex to rgb to create a less saturated/lighter version for hover
            const hex2rgb = (hex: string) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `${r}, ${g}, ${b}`;
            };
            const rgbColor = hex2rgb(baseColor);

            return (
              <button
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className="w-full text-left p-2 border border-black font-mono text-sm transition-colors"
                style={{
                  backgroundColor: isSelected ? baseColor : 'white',
                  color: isSelected ? 'white' : 'black',
                  // Using CSS custom properties for hover effect is tricky with inline styles,
                  // so we'll use a data attribute and global CSS or onMouseEnter/Leave
                  // But simpler: just add a CSS class that changes background color slightly when not selected
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = `rgba(${rgbColor}, 0.2)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">{loc.name}</span>
                  <span className="text-xs">{loc.count} obs</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Simple Map Outline */}
        {selectedLocationId && (
          <div className="mt-4 border border-black p-4 bg-white flex justify-center items-center">
            <WorldMapGraphic
              latitude={selectedLocationCoords?.latitude}
              longitude={selectedLocationCoords?.longitude}
              dotColor={selectedLocationColor}
            />
          </div>
        )}
      </div>

      {/* Right Column: Content Area */}
      <div className="flex-1 flex flex-col relative min-h-[500px] md:ml-8 lg:ml-12">
        {!selectedLocationId ? (
          <div className="absolute inset-0">
             <MapView data={data} resetTrigger={resetTrigger} />
          </div>
        ) : (
          <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-white text-black border border-black">
            <h2 className="text-2xl font-bold mb-8 border-b border-black pb-2">{selectedLocationName} - Analysis</h2>

            <div className="space-y-12">
              {/* Line Chart */}
              <div>
                <h3 className="text-lg font-bold mb-4 font-serif">Observations over Time (Month/Year)</h3>
                <div className="h-[500px] md:h-[800px] border border-black p-4">
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

              {/* Pie Chart */}
              <div>
                <h3 className="text-lg font-bold mb-4 font-serif">Species Composition (All-time Observations)</h3>
                <div className="h-[500px] md:h-[800px] border border-black p-4 flex items-center justify-center">
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius="75%"
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid black', fontFamily: 'monospace' }} formatter={(value, name) => [`${value} obs`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="font-mono text-gray-500">No species data available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
