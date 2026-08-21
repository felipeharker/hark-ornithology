import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';

interface MediaGridProps {
  items: EbirdMediaObservation[];
  onSelect: (index: number) => void;
  /** Figure numbering offset so captions can continue across groups on one page. */
  figOffset?: number;
}

// Consistent responsive thumbnail grid, used for Media and Checklist media views.
export function MediaGrid({ items, onSelect, figOffset = 0 }: MediaGridProps) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
      {items.map((m, idx) => (
        <figure key={m.MLCatalogNumber} className="m-0">
          <button
            type="button"
            onClick={() => onSelect(idx)}
            className="block w-full p-0 cursor-pointer transition-colors"
            style={{ border: '1px solid var(--color-divider)', background: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-divider)'; }}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={`https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${m.MLCatalogNumber}/1200`}
                alt={m.CommonName}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </div>
          </button>
          <figcaption className="hk-figcap mt-1">
            Fig. {figOffset + idx + 1} — {m.CommonName}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
