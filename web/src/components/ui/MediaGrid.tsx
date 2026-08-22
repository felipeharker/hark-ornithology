import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';

/** Macaulay Library serves media by catalog number; 1200 is the long edge. */
const ML_ASSET_BASE = 'https://cdn.download.ams.birds.cornell.edu/api/v1/asset';

export function mediaAssetUrl(catalogNumber: string, size: number = 1200): string {
  return `${ML_ASSET_BASE}/${catalogNumber}/${size}`;
}

interface MediaGridProps {
  items: EbirdMediaObservation[];
  onSelect: (index: number) => void;
  /** Figure numbering offset, so captions continue across groups on one page. */
  figOffset?: number;
}

/** Responsive thumbnail grid, shared by the Media section and checklist pages. */
export function MediaGrid({ items, onSelect, figOffset = 0 }: MediaGridProps) {
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
          <figcaption className="media-figcaption">
            Fig. {figOffset + idx + 1} — {m.CommonName}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
