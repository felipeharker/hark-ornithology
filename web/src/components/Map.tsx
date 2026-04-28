'use client';

import { useState, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationSummary } from '@/lib/data';

interface BirdMapProps {
  data: LocationSummary[];
  mapboxToken: string;
}

export default function BirdMap({ data, mapboxToken }: BirdMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationSummary | null>(null);

  // Calculate the center of the map based on data
  const initialViewState = useMemo(() => {
    if (data.length === 0) {
      return { longitude: -98.5795, latitude: 39.8283, zoom: 3 }; // Default center of US
    }

    // Simplistic center calculation
    const avgLat = data.reduce((sum, loc) => sum + loc.latitude, 0) / data.length;
    const avgLng = data.reduce((sum, loc) => sum + loc.longitude, 0) / data.length;

    return {
      longitude: avgLng,
      latitude: avgLat,
      zoom: 4,
    };
  }, [data]);

  return (
    <div className="w-full h-screen">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {data.map((location) => (
          <Marker
            key={location.locationId}
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedLocation(location);
            }}
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center">
               <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </Marker>
        ))}

        {selectedLocation && (
          <Popup
            longitude={selectedLocation.longitude}
            latitude={selectedLocation.latitude}
            anchor="top"
            onClose={() => setSelectedLocation(null)}
            closeOnClick={false}
            className="z-10"
            maxWidth="350px"
          >
            <div className="p-2 max-h-[300px] overflow-y-auto">
              <h3 className="font-bold text-lg mb-1">{selectedLocation.locationName}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {selectedLocation.uniqueSpeciesCount} unique species
              </p>

              <div className="space-y-3">
                {selectedLocation.observations.slice(0, 50).map((obs, i) => (
                  <div key={i} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                    <div className="font-semibold">{obs.commonName}</div>
                    <div className="text-gray-500 italic text-xs">{obs.scientificName}</div>
                    <div className="flex justify-between mt-1 text-xs text-gray-600">
                      <span>{obs.date}</span>
                      <span>Count: {obs.count === 'X' ? 'Present' : obs.count}</span>
                    </div>
                  </div>
                ))}
                {selectedLocation.observations.length > 50 && (
                  <div className="text-xs text-center text-gray-500 pt-2 italic">
                    And {selectedLocation.observations.length - 50} more observations...
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
