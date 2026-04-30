import { getLatestEbirdData } from '@/lib/parseEbirdData';
import LocationDashboard from '@/components/LocationDashboard';

export default function Home() {
  const { data, lastUpdated } = getLatestEbirdData();

  const uniqueSpecies = new Set(data.map(obs => obs.CommonName).filter(Boolean));

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-white text-black">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        <header className="border-b border-black pb-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Ornithological Report</h1>
          <div className="mt-2 flex flex-col sm:flex-row sm:justify-between text-sm md:text-base text-gray-600 font-mono">
            <p>Last Updated: {lastUpdated ? lastUpdated : 'None'}</p>
            <p>Life List: {data.length > 0 ? uniqueSpecies.size : 'None'}</p>
          </div>
        </header>

        <section>
          {data.length > 0 ? (
            <div className="bg-white">
              <div className="mb-4 border-b border-black pb-2">
                 <h2 className="text-xl md:text-2xl font-bold tracking-wider">Fig. 1: Observation Data and Distribution</h2>
              </div>
              <LocationDashboard data={data} />
            </div>
          ) : (
            <div className="p-8 md:p-12 border border-dashed border-black text-center font-mono text-gray-500">
              No observation data found. Please add ebird CSV data to the observation-data directory.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
