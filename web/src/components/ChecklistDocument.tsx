'use client';

import { useState } from 'react';
import { EbirdObservation, EbirdMediaObservation } from '@/lib/parseEbird';
import ImageLightbox from './ImageLightbox';
import { MediaGrid } from './ui/MediaGrid';
import { Section } from './ui/Section';

interface ChecklistDocumentProps {
  species: EbirdObservation[];
  media: EbirdMediaObservation[];
}

/**
 * The species table for one checklist, with a toggle to its photos when the
 * checklist has any. The heading follows the view, so the page always names
 * what is currently on screen.
 */
export default function ChecklistDocument({ species, media }: ChecklistDocumentProps) {
  const [viewMode, setViewMode] = useState<'list' | 'media'>('list');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const hasMedia = media.length > 0;

  return (
    <Section title={viewMode === 'list' ? 'Species Observed' : 'Media'}>
      <div className="toolbar">
        <p className="caption">
          {viewMode === 'list'
            ? `${species.length} species recorded.`
            : `${media.length} photograph${media.length === 1 ? '' : 's'} from this checklist.`}
        </p>
        {hasMedia && (
          <button
            type="button"
            className="btn"
            onClick={() => setViewMode(viewMode === 'list' ? 'media' : 'list')}
          >
            {viewMode === 'list' ? 'View Media' : 'View List'}
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Species</th>
                <th className="num-cell">Count</th>
              </tr>
            </thead>
            <tbody>
              {species.map((obs, idx) => (
                <tr key={idx}>
                  <td>
                    <div>
                      {obs.CommonName}
                      {obs.BreedingCode && <span className="tag tag--neutral">{obs.BreedingCode}</span>}
                    </div>
                    <div className="sci">{obs.ScientificName}</div>
                    {obs.ObservationDetails && <div className="caption">{obs.ObservationDetails}</div>}
                  </td>
                  {/* eBird records an unspecified quantity as "X". */}
                  <td className="num-cell">{obs.Count && obs.Count !== '' ? obs.Count : 'X'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <MediaGrid items={media} onSelect={setLightboxIndex} />
      )}

      {lightboxIndex !== null && (
        <ImageLightbox mediaList={media} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </Section>
  );
}
