import { getLatestEbirdData } from '@/lib/parseEbirdData';
import Link from 'next/link';

export async function generateStaticParams() {
  const { data } = getLatestEbirdData();
  const submissionIds = new Set(data.map((obs) => obs.SubmissionID).filter(Boolean));
  return Array.from(submissionIds).map((id) => ({
    id: id as string,
  }));
}

// Next.js dynamic route params
export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const submissionId = resolvedParams.id;

  const { data, lastUpdated } = getLatestEbirdData();

  // Find all observations for this checklist
  const checklistData = data.filter(obs => obs.SubmissionID === submissionId);

  if (checklistData.length === 0) {
    return (
      <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-white text-black font-mono">
        <div className="max-w-3xl mx-auto border border-black p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Checklist Not Found</h1>
          <p className="mb-8 text-gray-600">The checklist ID {submissionId} could not be found in the dataset.</p>
          <Link
            href="/"
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  // Extract checklist metadata from the first observation (they should all share these)
  const meta = checklistData[0];

  // Format Date nicely
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split(/[-/]/);
      if (parts.length >= 3) {
        let year, month, day;
        if (parts[0].length === 4) {
          [year, month, day] = parts;
        } else {
           [month, day, year] = parts;
        }

        const date = new Date(parseInt(year as string), parseInt(month as string) - 1, parseInt(day as string));
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch(_e) {}
    return dateStr;
  };

  const formattedDate = formatDate(meta.Date);

  // Group official location string (e.g. County, State, Country/Region)
  const officialGeographicalName = [meta.County, meta.StateProvince].filter(Boolean).join(', ');

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-[#f9fafb] text-black">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Navigation */}
        <div className="flex justify-between items-center bg-white p-4 border border-black">
          <Link
            href={`/?locationId=${meta.LocationID}`}
            className="flex items-center text-black hover:text-gray-600 font-mono text-sm transition-colors"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Return to Listing
          </Link>
        </div>

        {/* Header / Meta */}
        <div className="bg-white p-6 md:p-8 border border-black space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif">
              {formattedDate} <span className="text-gray-500 font-normal">{meta.Time}</span>
            </h1>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold">{meta.Location}</h2>
            {officialGeographicalName && (
              <p className="text-gray-600 font-mono text-sm">{officialGeographicalName}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4 font-mono text-sm">
            {meta.NumberOfObservers && (
              <div className="flex items-start">
                <div className="w-8 text-gray-500 flex-shrink-0">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div>{meta.NumberOfObservers} Observer{parseInt(meta.NumberOfObservers) > 1 ? 's' : ''}</div>
              </div>
            )}

            {meta.Protocol && (
              <div className="flex items-start">
                <div className="w-8 text-gray-500 flex-shrink-0">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div>
                  {meta.Protocol}
                  {meta.AllObsReported === '0' && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Incomplete</span>
                  )}
                </div>
              </div>
            )}

            {meta.ChecklistComments && (
              <div className="flex items-start">
                <div className="w-8 text-gray-500 flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="text-gray-800">{meta.ChecklistComments}</div>
              </div>
            )}
          </div>
        </div>

        {/* Species List */}
        <div className="bg-white border border-black">
          <div className="p-4 border-b border-black flex justify-between items-center">
            <h3 className="text-xl font-bold">{checklistData.length} Species</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {checklistData.map((obs, idx) => {
              // Ensure we display 'X' if count is missing/empty, otherwise the number
              const displayCount = obs.Count && obs.Count !== '' ? obs.Count : 'X';

              return (
                <div key={idx} className="flex">
                  <div className="w-16 p-4 border-r border-gray-200 flex items-center justify-center font-mono font-bold text-gray-600 flex-shrink-0">
                    {displayCount}
                  </div>
                  <div className="p-4 flex-1 space-y-1">
                    <div className="font-bold">{obs.CommonName}</div>

                    {obs.ObservationDetails && (
                      <div className="text-sm font-mono text-gray-600 mt-2 p-2 bg-gray-50 border-l-2 border-gray-300">
                        {obs.ObservationDetails}
                      </div>
                    )}

                    {obs.BreedingCode && (
                      <div className="text-xs font-mono inline-block px-2 py-1 bg-green-100 text-green-800 mt-2">
                        Breeding Code: {obs.BreedingCode}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm font-mono text-gray-500 py-8">
          Last updated {lastUpdated ? formatDate(lastUpdated) : 'Unknown'}
        </div>

      </div>
    </main>
  );
}
