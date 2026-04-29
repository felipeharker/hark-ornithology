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

  return (
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
              <div className="cursor-pointer text-red-500 hover:text-red-700 transition-colors">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
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
  );
}
