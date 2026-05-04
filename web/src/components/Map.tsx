"use client";

import { useMemo, useRef, useEffect } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EbirdObservation } from '../lib/parseEbirdData';

interface MapViewProps {
  data: EbirdObservation[];
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
}

interface LocationGroup {
  id: string;
  location: string;
  county: string;
  stateProvince: string;
  latitude: number;
  longitude: number;
  isHotspot: boolean;
  observations: EbirdObservation[];
}

export default function MapView({ data, selectedLocationId, onLocationSelect }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);

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
          isHotspot: key.startsWith('L'),
          observations: []
        };
      }
      groups[key].observations.push(obs);
    }
    return Object.values(groups);
  }, [data]);

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) return null;
    return locationGroups.find(g => g.id === selectedLocationId) || null;
  }, [selectedLocationId, locationGroups]);

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: 12,
        duration: 2000
      });
    } else if (!selectedLocation && mapRef.current) {
      // Zoom out to global state if selection cleared
       mapRef.current.flyTo({
          center: [-95.0, 38.0],
          zoom: 3,
          duration: 2000
        });
    }
  }, [selectedLocation]);

  return (
    <div className="w-full h-full border border-black relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -95.0,
          latitude: 38.0,
          zoom: 3
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {locationGroups.map((group) => {
          const isSelected = selectedLocation?.id === group.id;

          let markerColorClass = 'text-blue-500 hover:text-blue-700'; // Default personal
          if (isSelected) {
             markerColorClass = 'text-black hover:text-gray-800 z-10 relative scale-125';
          } else if (group.isHotspot) {
             markerColorClass = 'text-red-500 hover:text-red-700';
          }

          return (
            <Marker
              key={group.id}
              longitude={group.longitude}
              latitude={group.latitude}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onLocationSelect(group.id);
              }}
            >
              <div className={`cursor-pointer transition-colors ${markerColorClass}`}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="3" fill="white" />
                </svg>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
