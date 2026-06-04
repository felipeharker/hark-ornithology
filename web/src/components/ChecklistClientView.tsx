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
    <div className="bg-white border border-[#808080] mt-8">
      <div className="p-4 md:p-6 border-b border-[#808080] flex justify-between items-center bg-white">
        <h3 className="text-xl md:text-2xl font-bold font-serif">{checklistData.length} Species</h3>
        {mediaData.length > 0 && (
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'media' : 'list')}
            className="p-2 border border-[#808080] font-sans text-sm transition-colors hover:bg-gray-100 bg-white text-black"
          >
            {viewMode === 'list' ? 'View Media' : 'View List'}
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="divide-y divide-[#808080] bg-white">
          {checklistData.map((obs, idx) => {
            const displayCount = obs.Count && obs.Count !== '' ? obs.Count : 'X';

            return (
              <div key={idx} className="flex flex-row hover:bg-gray-50 transition-colors">
                <div className="w-16 md:w-24 p-4 border-r border-[#808080] flex items-start justify-center font-sans font-bold text-black flex-shrink-0">
                  {displayCount}
                </div>
                <div className="p-4 md:p-6 flex-1 space-y-1">
                  <div className="font-bold font-sans">{obs.CommonName} <span className="text-gray-500 italic text-sm font-normal ml-2">{obs.ScientificName}</span></div>

                  {obs.ObservationDetails && (
                    <div className="text-sm font-sans text-gray-800 mt-2 p-3 bg-gray-50 border border-[#808080]">
                      {obs.ObservationDetails}
                    </div>
                  )}

                  {obs.BreedingCode && (
                    <div className="text-xs font-sans inline-block px-2 py-1 border border-[#808080] bg-white text-black mt-2">
                      Breeding Code: {obs.BreedingCode}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 md:p-6 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaData.map((m, idx) => (
              <div
                key={m.MLCatalogNumber}
                className="cursor-pointer border border-[#808080] hover:border-[#808080] transition-colors bg-white"
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
                <div className="p-2 text-xs font-sans bg-white text-black truncate">
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
