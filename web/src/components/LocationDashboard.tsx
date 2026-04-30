'use client';

import React, { useState, useMemo } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import MapView from './Map';
import {
  BarChart,
  Bar,
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

const MONOCHROME_COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#E5E5E5'];

export default function LocationDashboard({ data }: LocationDashboardProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const locations = useMemo(() => {
    const locMap = new Map<string, { id: string; name: string }>();
    data.forEach((obs) => {
      if (obs.LocationID && !locMap.has(obs.LocationID)) {
        locMap.set(obs.LocationID, { id: obs.LocationID, name: obs.Location });
      }
    });
    return Array.from(locMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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

  const selectedLocationName = locations.find(l => l.id === selectedLocationId)?.name;

  return (
    <div className="flex flex-col md:flex-row border border-black min-h-[600px] bg-white">
      {/* Left Column: Locations List */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-black flex flex-col bg-gray-50">
        <div className="p-4 border-b border-black">
          <button
            onClick={() => setSelectedLocationId(null)}
            className={`w-full text-left p-2 border border-black font-mono text-sm transition-colors hover:bg-gray-200 ${!selectedLocationId ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            All Locations / View Map
          </button>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-[600px] p-4 space-y-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocationId(loc.id)}
              className={`w-full text-left p-2 border border-black font-mono text-sm transition-colors hover:bg-gray-200 ${selectedLocationId === loc.id ? 'bg-black text-white' : 'bg-white text-black'}`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Content Area */}
      <div className="flex-1 flex flex-col relative min-h-[500px]">
        {!selectedLocationId ? (
          <div className="absolute inset-0">
             <MapView data={data} />
          </div>
        ) : (
          <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-white text-black">
            <h2 className="text-2xl font-bold mb-8 border-b border-black pb-2">{selectedLocationName} - Analysis</h2>

            <div className="space-y-12">
              {/* Bar Chart */}
              <div>
                <h3 className="text-lg font-bold mb-4 font-serif">Observations over Time (Month/Year)</h3>
                <div className="h-64 border border-black p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="date" tick={{fontFamily: 'monospace', fontSize: 12}} />
                      <YAxis allowDecimals={false} tick={{fontFamily: 'monospace', fontSize: 12}} />
                      <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid black', fontFamily: 'monospace' }} />
                      <Bar dataKey="count" fill="#000000" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div>
                <h3 className="text-lg font-bold mb-4 font-serif">Species Composition (All-time Observations)</h3>
                <div className="h-80 border border-black p-4 flex items-center justify-center">
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          isAnimationActive={false}
                          label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          labelLine={true}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={MONOCHROME_COLORS[index % MONOCHROME_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid black', fontFamily: 'monospace' }} />
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
