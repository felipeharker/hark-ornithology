'use client';

import { useCallback, useState, useEffect } from 'react';
import { EbirdMediaObservation } from '../lib/parseEbird';
import { CloseIcon, ArrowLeftIcon, ArrowRightIcon } from './ui/Icons';
import { mediaAssetUrl } from './ui/MediaGrid';

interface ImageLightboxProps {
  mediaList: EbirdMediaObservation[];
  initialIndex: number;
  onClose: () => void;
}

/** Fullscreen photo viewer. Escape closes; arrow keys page through the set. */
export default function ImageLightbox({ mediaList, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextImage = useCallback(
    () => setCurrentIndex((prev) => (prev + 1) % mediaList.length),
    [mediaList.length]
  );

  const prevImage = useCallback(
    () => setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length),
    [mediaList.length]
  );

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
      className="lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${currentMedia.CommonName} image viewer`}
    >
      <button
        type="button"
        className="lightbox-btn lightbox-btn--close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
      >
        <CloseIcon />
      </button>

      {mediaList.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox-btn lightbox-btn--prev"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            aria-label="Previous image"
          >
            <ArrowLeftIcon />
          </button>
          <button
            type="button"
            className="lightbox-btn lightbox-btn--next"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            aria-label="Next image"
          >
            <ArrowRightIcon />
          </button>
        </>
      )}

      <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote
            Macaulay Library asset; see the note in MediaGrid. */}
        <img src={mediaAssetUrl(currentMedia.MLCatalogNumber)} alt={currentMedia.CommonName} />
        <div className="lightbox-caption">
          <p className="name">
            {currentMedia.CommonName} <span className="sci">{currentMedia.ScientificName}</span>
          </p>
          <p className="meta">
            {currentMedia.Locality && `${currentMedia.Locality} · `}
            {currentMedia.Date} {currentMedia.Time} · By {currentMedia.Recordist}
          </p>
          <p className="index">
            Image {currentIndex + 1} of {mediaList.length} · ML Catalog #{currentMedia.MLCatalogNumber}
          </p>
        </div>
      </div>
    </div>
  );
}
