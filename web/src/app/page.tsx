import { getLatestEbirdData } from '@/lib/parseEbirdData';
import { getLatestEbirdMediaData } from '@/lib/parseEbirdMediaData';
import { getFieldNotes } from '@/lib/parseFieldNotes';
import LocationDashboard from '@/components/LocationDashboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getSiteOptions } from '@/lib/parseOptions';

// Wrap search param usage in a component to let Next.js stream it or handle it cleanly
export default function Home() {
  const { data } = getLatestEbirdData();
  const { data: mediaData } = getLatestEbirdMediaData();
  const fieldNotes = getFieldNotes();
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
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col space-y-4">
          <h1 className="text-[clamp(1.5rem,5vw,3rem)] md:text-5xl font-bold font-serif whitespace-nowrap pb-2">{options.title}</h1>
          <div className="flex flex-col text-sm md:text-base text-gray-600 font-sans space-y-1">
            <p className="whitespace-nowrap">Latest Checklist: {latestChecklistDate}</p>
            <p className="whitespace-nowrap">Life List: {data.length > 0 ? uniqueSpecies.size : 'None'}</p>
          </div>
        </header>

        <section className="mt-16 md:mt-24">
          {data.length > 0 ? (
            <div className="bg-white">
              <LocationDashboard data={data} mediaData={mediaData} fieldNotes={fieldNotes} options={options} />
            </div>
          ) : (
            <EmptyState className="p-8 md:p-12">
              No observation data found. Please add ebird CSV data to the observation-data directory.
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
