"use client";

import { useState, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EbirdObservation } from '../lib/parseEbirdData';

interface MapViewProps {
  data: EbirdObservation[];
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

export default function MapView({ data }: MapViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationGroup | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="w-full h-[800px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative">
        <Map
          initialViewState={{
            longitude: -95.0,
            latitude: 38.0,
            zoom: 3
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        >
          {locationGroups.map((group) => {
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
                <div className="cursor-pointer text-orange-500 hover:text-orange-700 transition-colors drop-shadow-md">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="3" fill="white" />
                  </svg>
                </div>
              </Marker>
            );
          })}

          {selectedLocation && (
            <Popup
              anchor="top"
              longitude={selectedLocation.longitude}
              latitude={selectedLocation.latitude}
              onClose={() => setSelectedLocation(null)}
              closeOnClick={false}
              maxWidth="400px"
            >
              <div className="p-2 text-sm text-gray-800 max-h-[300px] overflow-y-auto">
                <h3 className="font-bold text-lg mb-1">{selectedLocation.location}</h3>
                <p className="text-gray-600 mb-3 text-xs border-b pb-2">
                  {selectedLocation.county}, {selectedLocation.stateProvince} &bull; {selectedLocation.observations.length} observation{selectedLocation.observations.length !== 1 ? 's' : ''}
                </p>

                <div className="space-y-3">
                  {selectedLocation.observations.map(obs => (
                    <div key={obs.SubmissionID + obs.CommonName} className="bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{obs.CommonName}</p>
                          <p className="italic text-gray-500 text-xs">{obs.ScientificName}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                          Count: {obs.Count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{obs.Date} {obs.Time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {selectedLocation && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8 space-y-8">
          <header>
            <h2 className="text-2xl font-bold text-gray-900">{selectedLocation.location}</h2>
            <p className="text-gray-600">{selectedLocation.county}, {selectedLocation.stateProvince}</p>
          </header>

          <section>
            <h3 className="text-lg font-semibold mb-3">Overall Species Totals</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Species</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Total Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overallTotals.map(item => (
                    <tr key={item.commonName}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.commonName}</div>
                        <div className="text-xs text-gray-500 italic">{item.scientificName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-gray-700">
                        {item.onlyX ? 'X' : item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
            {Object.entries(monthlyTotals).length === 0 ? (
              <p className="text-gray-500 italic">No dates available to group by month.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(monthlyTotals).map(([monthYear, totals]) => (
                  <div key={monthYear} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-gray-700">
                      {monthYear}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {totals.map(item => (
                            <tr key={item.commonName}>
                              <td className="px-4 py-3 whitespace-nowrap w-2/3">
                                <div className="font-medium text-gray-900">{item.commonName}</div>
                                <div className="text-xs text-gray-500 italic">{item.scientificName}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap w-1/3 text-right font-semibold text-gray-700">
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
      )}
    </div>
  );
}
