"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { geoPath, geoEquirectangular } from 'd3-geo';
import * as topojson from 'topojson-client';

interface WorldMapGraphicProps {
  latitude?: number;
  longitude?: number;
  dotColor?: string;
}

// Minimal types for the parsed GeoJSON
interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
  properties?: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export default function WorldMapGraphic({ latitude, longitude, dotColor = '#ffa500' }: WorldMapGraphicProps) {
  const [worldData, setWorldData] = useState<GeoJSONFeatureCollection | null>(null);

  useEffect(() => {
    // Fetch the topology data from the public folder
    fetch('/world-110m.json')
      .then((response) => response.json())
      .then((topology) => {
        // Convert TopoJSON to GeoJSON
        // Use the "land" object from TopoJSON to render only landmass outlines, no national borders.
        // Typecast topology and objects to bypass strict TS issues with topojson API if needed.
        const geojson = topojson.feature(
          topology as Parameters<typeof topojson.feature>[0],
          topology.objects.land
        ) as unknown as GeoJSONFeatureCollection;
        setWorldData(geojson);
      })
      .catch((error) => console.error('Error fetching world data:', error));
  }, []);

  // Set up the projection
  const projection = useMemo(() => {
    // Equirectangular is simple and flat
    return geoEquirectangular()
      .scale(150)
      .translate([480, 250]); // Center of the 960x500 viewBox
  }, []);

  const pathGenerator = useMemo(() => {
    return geoPath().projection(projection);
  }, [projection]);

  // Calculate dot coordinates
  const dotCoords = useMemo(() => {
    if (latitude !== undefined && longitude !== undefined) {
      return projection([longitude, latitude]);
    }
    return null;
  }, [latitude, longitude, projection]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <svg
        viewBox="0 0 960 500"
        width="100%"
        height="100%"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Render Map Features */}
        {worldData && worldData.features && (
          <g>
            {worldData.features.map((feature, i) => {
              // We need to cast the feature to any here just for the pathGenerator
              // because d3-geo's geoPath expects a specific internal GeoPermissibleObjects type
              // but we're working with custom simple interfaces
              // To avoid @typescript-eslint/no-explicit-any error, we can cast through unknown.
              const d3Feature = feature as unknown as GeoJSON.Feature;
              return (
                <path
                  key={i}
                  d={pathGenerator(d3Feature) || undefined}
                  fill="none"
                  stroke="black"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        {/* Render Selected Location Dot */}
        {dotCoords && (
          <circle
            cx={dotCoords[0]}
            cy={dotCoords[1]}
            r="5"
            fill={dotColor}
          />
        )}
      </svg>
    </div>
  );
}
