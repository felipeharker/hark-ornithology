import { EbirdMediaObservation } from '@/lib/parseEbird';

/** Macaulay Library serves media by catalog number; 1200 is the long edge. */
const ML_ASSET_BASE = 'https://cdn.download.ams.birds.cornell.edu/api/v1/asset';

export function mediaAssetUrl(catalogNumber: string, size: number = 1200): string {
  return `${ML_ASSET_BASE}/${catalogNumber}/${size}`;
}

interface MediaGridProps {
  items: EbirdMediaObservation[];
  onSelect: (index: number) => void;
}

/**
 * Responsive thumbnail grid, shared by the Media section and checklist pages.
 *
 * Each caption is the species name alone. The grid used to number its figures
 * continuously across the page ("Fig. 37 — Northern Cardinal"), which meant
 * every group had to be told how many photos preceded it; nothing ever cited
 * a figure by number, so both the numbering and the offset it needed are gone.
 */
export function MediaGrid({ items, onSelect }: MediaGridProps) {
  return (
    <div className="media-grid">
      {items.map((m, idx) => (
        <figure key={m.MLCatalogNumber}>
          <button
            type="button"
            className="media-thumb"
            onClick={() => onSelect(idx)}
            aria-label={`View ${m.CommonName} full size`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote
                Macaulay Library assets; next/image is unavailable under
                output: 'export' without a custom loader. */}
            <img src={mediaAssetUrl(m.MLCatalogNumber)} alt={m.CommonName} loading="lazy" />
          </button>
          <figcaption className="media-figcaption">{m.CommonName}</figcaption>
        </figure>
      ))}
    </div>
  );
}
