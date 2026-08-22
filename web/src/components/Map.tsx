'use client';

/**
 * The observation map.
 *
 * DATA: pins come straight from the eBird export in observation-data/ — the
 * Latitude/Longitude columns of each row, grouped by Location ID so repeat
 * visits to one site share a pin. Nothing here is hardcoded to a place.
 *
 * STYLING: every visual property lives in src/app/styles_map.css. The only
 * appearance decision in this file is BASEMAP_STYLE_URL below, because a
 * MapLibre basemap is described by a JSON style document rather than by CSS —
 * see the header comment in styles_map.css for where that line is drawn.
 */

import { useMemo, useRef, useEffect } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EbirdObservation } from '../lib/parseEbirdData';
import { MapPinIcon } from './ui/Icons';

/**
 * The basemap. This is a MapLibre Style JSON document, not CSS — point it at a
 * different style URL to change the map's own colours, labels, and detail.
 * Carto "Positron" is a pale grey basemap chosen so the pins carry the colour.
 */
const BASEMAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

/** Camera position when nothing is selected: the whole world. */
const HOME_VIEW = { longitude: -95.0, latitude: 38.0, zoom: 1 };

/** Camera zoom when a single location is selected. */
const DETAIL_ZOOM = 12;

const FLY_DURATION_MS = 2000;

interface MapViewProps {
  data: EbirdObservation[];
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
}

interface LocationGroup {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
}

export default function MapView({ data, selectedLocationId, onLocationSelect }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);

  // One pin per distinct location. Rows without a Location ID fall back to
  // their coordinate pair so an unnamed stop still appears.
  const locationGroups = useMemo(() => {
    const groups: Record<string, LocationGroup> = {};
    for (const obs of data) {
      const key = obs.LocationID || `${obs.Latitude},${obs.Longitude}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          location: obs.Location,
          latitude: obs.Latitude,
          longitude: obs.Longitude,
        };
      }
    }
    return Object.values(groups);
  }, [data]);

  const selectedLocation = useMemo(
    () => (selectedLocationId ? locationGroups.find((g) => g.id === selectedLocationId) || null : null),
    [selectedLocationId, locationGroups]
  );

  // Fly to the selected location, or back out to the world view when cleared.
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedLocation) {
      mapRef.current.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: DETAIL_ZOOM,
        duration: FLY_DURATION_MS,
      });
    } else {
      mapRef.current.flyTo({
        center: [HOME_VIEW.longitude, HOME_VIEW.latitude],
        zoom: HOME_VIEW.zoom,
        duration: FLY_DURATION_MS,
      });
    }
  }, [selectedLocation]);

  return (
    <div className="map-frame">
      <Map ref={mapRef} initialViewState={HOME_VIEW} mapStyle={BASEMAP_STYLE_URL}>
        {locationGroups.map((group) => {
          const isSelected = selectedLocation?.id === group.id;
          return (
            <Marker
              key={group.id}
              longitude={group.longitude}
              latitude={group.latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onLocationSelect(group.id);
              }}
            >
              <button
                type="button"
                className="map-pin"
                data-selected={isSelected}
                aria-label={`${group.location}${isSelected ? ' (selected)' : ''}`}
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
