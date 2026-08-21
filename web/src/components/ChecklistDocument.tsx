'use client';

import { useState } from 'react';
import { EbirdObservation } from '@/lib/parseEbirdData';
import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';
import ImageLightbox from './ImageLightbox';
import { MediaGrid } from './ui/MediaGrid';

interface ChecklistDocumentProps {
  species: EbirdObservation[];
  media: EbirdMediaObservation[];
}

export default function ChecklistDocument({ species, media }: ChecklistDocumentProps) {
  const [viewMode, setViewMode] = useState<'list' | 'media'>('list');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const hasMedia = media.length > 0;

  return (
    <section style={{ marginTop: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-3)' }}>
        <div className="hk-figcap">Table 1 — Species Observed ({species.length} total)</div>
        {hasMedia && (
          <button type="button" className="btn btn-secondary" onClick={() => setViewMode(viewMode === 'list' ? 'media' : 'list')}>
            {viewMode === 'list' ? 'View Media' : 'View List'}
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <table className="table">
          <thead><tr><th>Species</th><th style={{ textAlign: 'right' }}>Count</th></tr></thead>
          <tbody>
            {species.map((obs, idx) => {
              const displayCount = obs.Count && obs.Count !== '' ? obs.Count : 'X';
              return (
                <tr key={idx}>
                  <td>
                    {obs.CommonName}{' '}
                    <span style={{ opacity: 0.6, fontStyle: 'italic', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{obs.ScientificName}</span>
                    {obs.BreedingCode && (
                      <span className="tag tag-neutral" style={{ marginLeft: 'var(--space-2)' }}>{obs.BreedingCode}</span>
                    )}
                    {obs.ObservationDetails && (
                      <div className="hk-figcap" style={{ marginTop: 4, opacity: 0.8 }}>{obs.ObservationDetails}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{displayCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <MediaGrid items={media} onSelect={setLightboxIndex} />
      )}

      {lightboxIndex !== null && (
        <ImageLightbox mediaList={media} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </section>
  );
}
