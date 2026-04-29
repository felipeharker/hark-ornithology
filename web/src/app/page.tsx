import { getLatestEbirdData } from '@/lib/parseEbirdData';
import MapView from '@/components/Map';

export default function Home() {
  const data = getLatestEbirdData();

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">hark-ornithology</h1>
          <p className="text-lg text-gray-600">Personal birding project visualizing eBird data</p>
        </header>

        <section>
          {data.length > 0 ? (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="mb-4 flex items-center justify-between">
                 <h2 className="text-xl font-semibold">Observations Map</h2>
                 <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {data.length} records found
                 </span>
              </div>
              <MapView data={data} />
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500">
              No observation data found. Please add ebird CSV data to the <code>observation-data</code> directory.
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
