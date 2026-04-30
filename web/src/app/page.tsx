import { getLatestEbirdData } from '@/lib/parseEbirdData';
import MapView from '@/components/Map';

export default function Home() {
  const data = getLatestEbirdData();

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-white text-black">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        <header className="border-b-2 border-black pb-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">Ornithological Report</h1>
          <div className="mt-2 flex flex-col sm:flex-row sm:justify-between text-sm md:text-base text-gray-600 font-mono">
            <p>Dataset: eBird Export</p>
            <p>Records: {data.length > 0 ? data.length : 'None'}</p>
          </div>
        </header>

        <section>
          {data.length > 0 ? (
            <div className="bg-white">
              <div className="mb-4 border-b border-gray-300 pb-2">
                 <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wider">Fig. 1: Spatial Distribution of Observations</h2>
              </div>
              <MapView data={data} />
            </div>
          ) : (
            <div className="p-8 md:p-12 border-2 border-dashed border-gray-300 text-center font-mono text-gray-500">
              No observation data found. Please add ebird CSV data to the observation-data directory.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
