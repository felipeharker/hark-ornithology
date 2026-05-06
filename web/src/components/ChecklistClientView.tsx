'use client';

import React, { useState } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';
import ImageLightbox from './ImageLightbox';

interface ChecklistClientViewProps {
  checklistData: EbirdObservation[];
  mediaData: EbirdMediaObservation[];
}

export default function ChecklistClientView({ checklistData, mediaData }: ChecklistClientViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'media'>('list');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="bg-white border border-black mt-6">
      <div className="p-4 border-b border-black flex justify-between items-center bg-white">
        <h3 className="text-xl font-bold">{checklistData.length} Species</h3>
        {mediaData.length > 0 && (
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'media' : 'list')}
            className="p-2 border border-black font-mono text-sm transition-colors hover:bg-gray-100 bg-gray-100 text-black"
          >
            {viewMode === 'list' ? 'View Media' : 'View List'}
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="divide-y divide-gray-200">
          {checklistData.map((obs, idx) => {
            const displayCount = obs.Count && obs.Count !== '' ? obs.Count : 'X';

            return (
              <div key={idx} className="flex">
                <div className="w-16 p-4 border-r border-gray-200 flex items-center justify-center font-mono font-bold text-gray-600 flex-shrink-0">
                  {displayCount}
                </div>
                <div className="p-4 flex-1 space-y-1">
                  <div className="font-bold">{obs.CommonName}</div>

                  {obs.ObservationDetails && (
                    <div className="text-sm font-mono text-gray-600 mt-2 p-2 bg-gray-50 border-l-2 border-gray-300">
                      {obs.ObservationDetails}
                    </div>
                  )}

                  {obs.BreedingCode && (
                    <div className="text-xs font-mono inline-block px-2 py-1 bg-green-100 text-green-800 mt-2">
                      Breeding Code: {obs.BreedingCode}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaData.map((m, idx) => (
              <div
                key={m.MLCatalogNumber}
                className="cursor-pointer border border-gray-200 hover:border-black transition-colors"
                onClick={() => setLightboxIndex(idx)}
              >
                <div className="aspect-square bg-gray-100 overflow-hidden relative">
                  <img
                    src={`https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${m.MLCatalogNumber}/1200`}
                    alt={m.CommonName}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-2 text-xs font-mono bg-white text-black truncate">
                  {m.CommonName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          mediaList={mediaData}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
