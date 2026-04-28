'use client';

import { LocationSummary } from '@/lib/data';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the Map component to prevent SSR issues with Mapbox
const DynamicMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center bg-gray-100">Loading Map...</div>
});

export default function Home() {
  const [birdingData, setBirdingData] = useState<LocationSummary[]>([]);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  useEffect(() => {
    // Fetch data from API route instead of trying to read file directly on client
    fetch('/api/data')
      .then((res) => res.json())
      .then((data) => setBirdingData(data))
      .catch((error) => console.error('Failed to load data:', error));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <DynamicMap data={birdingData} mapboxToken={mapboxToken} />

      {!mapboxToken && mapboxToken !== 'placeholder' && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-lg">
          <strong className="font-bold">Missing Mapbox Token!</strong>
          <span className="block sm:inline"> Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.</span>
        </div>
      )}
    </main>
  );
}