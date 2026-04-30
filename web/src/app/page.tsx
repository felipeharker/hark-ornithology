import { getLatestEbirdData } from '@/lib/parseEbirdData';
import MapView from '@/components/Map';

export default function Home() {
  const data = getLatestEbirdData();

  return (
    <main className="min-h-screen p-4 md:p-8 bg-white text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <header className="space-y-2 md:space-y-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">hark-ornithology</h1>
          <p className="text-base md:text-lg text-gray-600">Personal birding project visualizing eBird data</p>
        </header>

        <section>
          {data.length > 0 ? (
            <div className="bg-white p-0 md:p-4">
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                 <h2 className="text-lg md:text-xl font-semibold">Observations Map</h2>
                 <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 border border-gray-200">
                    {data.length} records found
                 </span>
              </div>
              <MapView data={data} />
            </div>
          ) : (
            <div className="text-center p-8 md:p-12 bg-white border border-gray-200 text-gray-500">
              No observation data found. Please add ebird CSV data to the <code>observation-data</code> directory.
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
