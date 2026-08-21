'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { EbirdMediaObservation } from '../lib/parseEbirdMediaData';
import { CloseIcon, ArrowLeftIcon, ArrowRightIcon } from './ui/Icons';

interface ImageLightboxProps {
  mediaList: EbirdMediaObservation[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ mediaList, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  }, [mediaList.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextImage, prevImage, onClose]);

  const currentMedia = mediaList[currentIndex];
  if (!currentMedia) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'color-mix(in srgb, var(--color-neutral-900) 90%, transparent)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${currentMedia.CommonName} image viewer`}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        className="absolute top-4 right-4 z-50 cursor-pointer p-2"
        style={{ background: 'none', border: 'none', color: 'var(--color-bg)' }}
      >
        <CloseIcon />
      </button>

      {mediaList.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 cursor-pointer p-2"
            style={{ background: 'none', border: 'none', color: 'var(--color-bg)' }}
          >
            <ArrowLeftIcon />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 cursor-pointer p-2"
            style={{ background: 'none', border: 'none', color: 'var(--color-bg)' }}
          >
            <ArrowRightIcon />
          </button>
        </>
      )}

      <div
        className="relative w-full h-full max-w-5xl max-h-[85vh] flex flex-col items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${currentMedia.MLCatalogNumber}/1200`}
          alt={currentMedia.CommonName}
          className="max-w-full max-h-[80vh] object-contain"
        />
        <div className="mt-4 text-center w-full max-w-3xl" style={{ color: 'var(--color-bg)', fontFamily: 'var(--font-mono)' }}>
          <p style={{ fontSize: 14 }}>
            {currentMedia.CommonName}{' '}
            <span style={{ opacity: 0.7, fontStyle: 'italic' }}>{currentMedia.ScientificName}</span>
          </p>
          <p style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            {currentMedia.Locality && `${currentMedia.Locality} · `}
            {currentMedia.Date} {currentMedia.Time} · By {currentMedia.Recordist}
          </p>
          <p style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
            Image {currentIndex + 1} of {mediaList.length} · ML Catalog #{currentMedia.MLCatalogNumber}
          </p>
        </div>
      </div>
    </div>
  );
}
