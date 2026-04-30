'use client';

import React, { useState, useMemo } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import MapView from './Map';
import * as d3Geo from 'd3-geo';
import worldGeoJson from '@/data/world.json';

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
    if (!locationData.length) return [];

    const monthlyCounts = new Map<string, number>();
    locationData.forEach((obs) => {
      // Date format is likely MM/DD/YYYY or similar, we should normalize to YYYY-MM
      // Let's assume MM/DD/YYYY or YYYY-MM-DD
      let yearMonth = 'Unknown';
      if (obs.Date) {
        const parts = obs.Date.split(/[-/]/);
        if (parts.length >= 3) {
           // Basic check to see if year is first or last
           if (parts[0].length === 4) {
             // YYYY-MM-DD
             yearMonth = `${parts[0]}-${parts[1].padStart(2, '0')}`;
           } else {
             // MM/DD/YYYY
             yearMonth = `${parts[2]}-${parts[0].padStart(2, '0')}`;
           }
        }
      }
      monthlyCounts.set(yearMonth, (monthlyCounts.get(yearMonth) || 0) + 1);
    });

    return Array.from(monthlyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [locationData]);

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

  // Calculate map outline projection if a location is selected
  const { pathGenerator, mapDotCoords } = useMemo(() => {
    if (!selectedLocationData) return { pathGenerator: null, mapDotCoords: null };
    // Find the first observation for this location to get lat/lng
    const obs = data.find(o => o.LocationID === selectedLocationId);
    if (!obs || !obs.Latitude || !obs.Longitude) return { pathGenerator: null, mapDotCoords: null };

    // Create a projection fitting a standard 300x150 box
    const projection = d3Geo.geoEquirectangular()
      .fitSize([280, 140], worldGeoJson as unknown as d3Geo.ExtendedFeatureCollection);

    const pathGenerator = d3Geo.geoPath().projection(projection);
    const mapDotCoords = projection([obs.Longitude, obs.Latitude]);

    return { pathGenerator, mapDotCoords };
  }, [selectedLocationData, selectedLocationId, data]);

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
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocationId(loc.id)}
              className={`w-full text-left p-2 border border-black font-mono text-sm transition-colors hover:bg-black hover:text-white ${selectedLocationId === loc.id ? 'bg-black text-white' : 'bg-white text-black'}`}
            >
              <div className="flex justify-between items-center">
                <span className="truncate mr-2">{loc.name}</span>
                <span className="text-xs">{loc.count} obs</span>
              </div>
            </button>
          ))}
        </div>

        {/* Simple Map Outline */}
        {selectedLocationId && pathGenerator && (
          <div className="mt-4 border border-black p-4 bg-white flex justify-center items-center">
            <svg width="280" height="140" viewBox="0 0 280 140">
              <path
                d={pathGenerator(worldGeoJson as unknown as d3Geo.ExtendedFeatureCollection) || ''}
                fill="none"
                stroke="black"
                strokeWidth="0.5"
              />
              {mapDotCoords && (
                <circle
                  cx={mapDotCoords[0]}
                  cy={mapDotCoords[1]}
                  r="3"
                  fill="#ffa500"
                />
              )}
            </svg>
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
