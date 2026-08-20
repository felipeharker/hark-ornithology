import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';

interface MediaGridProps {
  items: EbirdMediaObservation[];
  onSelect: (index: number) => void;
}

// Consistent responsive thumbnail grid, used everywhere media is shown.
export function MediaGrid({ items, onSelect }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((m, idx) => (
        <button
          key={m.MLCatalogNumber}
          type="button"
          onClick={() => onSelect(idx)}
          className="text-left cursor-pointer border border-gray-200 hover:border-black transition-colors bg-white"
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
        </button>
      ))}
    </div>
  );
}
