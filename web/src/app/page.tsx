import { getLatestEbirdData } from '@/lib/parseEbirdData';
import LocationDashboard from '@/components/LocationDashboard';
import { Suspense } from 'react';
import { getSiteOptions } from '@/lib/parseOptions';

// Wrap search param usage in a component to let Next.js stream it or handle it cleanly
export default function Home() {
  const { data } = getLatestEbirdData();
  const options = getSiteOptions();
  const uniqueSpecies = new Set(data.map(obs => obs.CommonName).filter(Boolean));

  // Find the date of the latest checklist
  let latestChecklistDate = 'None';
  if (data.length > 0) {
    const dates = data.map(obs => obs.Date).filter(Boolean);
    if (dates.length > 0) {
      // Sort dates descending
      dates.sort((a, b) => b.localeCompare(a));
      latestChecklistDate = dates[0];

      // Format it nicely if possible (assuming YYYY-MM-DD or MM/DD/YYYY)
      try {
        const parts = latestChecklistDate.split(/[-/]/);
        if (parts.length >= 3) {
          let year, month, day;
          if (parts[0].length === 4) {
            [year, month, day] = parts;
          } else {
             [month, day, year] = parts;
          }
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          latestChecklistDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch(_e) {}
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-white text-black">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        <header className="border-b border-black pb-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{options.title}</h1>
          <div className="mt-2 flex flex-col sm:flex-row sm:justify-between text-sm md:text-base text-gray-600 font-mono">
            <p>Latest Checklist: {latestChecklistDate}</p>
            <p>Life List: {data.length > 0 ? uniqueSpecies.size : 'None'}</p>
          </div>
        </header>

        <section>
          {data.length > 0 ? (
            <div className="bg-white">
              <div className="mb-4 border-b border-black pb-2">
                 <h2 className="text-xl md:text-2xl font-bold tracking-wider">Fig. 1: Observation Data and Distribution</h2>
              </div>
              <Suspense fallback={<div className="font-mono">Loading data...</div>}>
                <LocationDashboard data={data} options={options} />
              </Suspense>
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
