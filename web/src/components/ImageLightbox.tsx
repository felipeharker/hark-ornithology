'use client';

import React, { useState, useEffect } from 'react';
import { EbirdMediaObservation } from '../lib/parseEbirdMediaData';

interface ImageLightboxProps {
  mediaList: EbirdMediaObservation[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ mediaList, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, mediaList.length]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const currentMedia = mediaList[currentIndex];
  if (!currentMedia) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl font-mono hover:text-gray-300 z-50"
      >
        &times;
      </button>

      {mediaList.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl p-2 hover:text-gray-300 z-50 font-mono"
          >
            &#8592;
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl p-2 hover:text-gray-300 z-50 font-mono"
          >
            &#8594;
          </button>
        </>
      )}

      <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex flex-col items-center justify-center p-4">
        <img
          src={`https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${currentMedia.MLCatalogNumber}/1200`}
          alt={currentMedia.CommonName}
          className="max-w-full max-h-[80vh] object-contain shadow-lg"
        />
        <div className="mt-4 text-white text-center font-mono w-full max-w-3xl">
          <p className="text-xl font-bold">{currentMedia.CommonName} <span className="text-gray-400 italic text-lg">{currentMedia.ScientificName}</span></p>
          <p className="text-sm mt-1 text-gray-300">
            {currentMedia.Locality && `${currentMedia.Locality} • `}
            {currentMedia.Date} {currentMedia.Time} •
            By {currentMedia.Recordist}
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Image {currentIndex + 1} of {mediaList.length} • ML Catalog #: {currentMedia.MLCatalogNumber}
          </p>
        </div>
      </div>
    </div>
  );
}
