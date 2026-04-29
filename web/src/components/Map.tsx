"use client";

import { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EbirdObservation } from '../lib/parseEbirdData';

interface MapViewProps {
  data: EbirdObservation[];
}

export default function MapView({ data }: MapViewProps) {
  const [selectedObservation, setSelectedObservation] = useState<EbirdObservation | null>(null);

  return (
    <div className="w-full h-[800px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <Map
        initialViewState={{
          longitude: -95.0,
          latitude: 38.0,
          zoom: 3
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {data.map((obs) => {
          // Add a small random offset if markers overlap too perfectly, but here we can just render them
          return (
            <Marker
              key={obs.SubmissionID + obs.CommonName}
              longitude={obs.Longitude}
              latitude={obs.Latitude}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedObservation(obs);
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

        {selectedObservation && (
          <Popup
            anchor="top"
            longitude={selectedObservation.Longitude}
            latitude={selectedObservation.Latitude}
            onClose={() => setSelectedObservation(null)}
            closeOnClick={false}
          >
            <div className="p-2 text-sm text-gray-800">
              <h3 className="font-bold text-lg mb-1">{selectedObservation.CommonName}</h3>
              <p className="italic text-gray-600 mb-2">{selectedObservation.ScientificName}</p>
              <div className="space-y-1">
                <p><strong>Location:</strong> {selectedObservation.Location} ({selectedObservation.County}, {selectedObservation.StateProvince})</p>
                <p><strong>Date:</strong> {selectedObservation.Date} {selectedObservation.Time}</p>
                <p><strong>Count:</strong> {selectedObservation.Count}</p>
                {selectedObservation.ObservationDetails && (
                  <p><strong>Details:</strong> {selectedObservation.ObservationDetails}</p>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
