"use client";

import { useMemo, useRef, useEffect } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EbirdObservation } from '../lib/parseEbirdData';
import { MapPinIcon } from './ui/Icons';

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
          zoom: 1,
          duration: 2000
        });
    }
  }, [selectedLocation]);

  return (
    <div className="w-full h-full relative" style={{ border: '1px solid var(--color-divider)' }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -95.0,
          latitude: 38.0,
          zoom: 1
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {locationGroups.map((group) => {
          const isSelected = selectedLocation?.id === group.id;
          // Use opacity on hover for non-selected items to give a visual cue
          const markerColorClass = isSelected
            ? 'z-10 relative scale-125'
            : 'hover:opacity-80';
          const markerStyle = { color: isSelected ? 'var(--color-text)' : 'var(--color-accent)' };

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
              <button
                type="button"
                aria-label={`${group.location}${isSelected ? ' (selected)' : ''}`}
                className={`cursor-pointer transition-colors ${markerColorClass}`}
                style={markerStyle}
              >
                <MapPinIcon />
              </button>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
