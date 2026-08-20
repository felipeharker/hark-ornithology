import type { Metadata } from 'next';
import { getLatestEbirdData } from '@/lib/parseEbirdData';
import { getLatestEbirdMediaData } from '@/lib/parseEbirdMediaData';
import { getSiteOptions } from '@/lib/parseOptions';
import ChecklistClientView from '@/components/ChecklistClientView';
import { Badge } from '@/components/ui/Badge';
import { ChevronLeftIcon, PersonIcon, ClockIcon, CommentIcon } from '@/components/ui/Icons';
import Link from 'next/link';

// eBird dates come as either YYYY-MM-DD or MM/DD/YYYY; disambiguate by part length.
function formatDate(dateStr: string): string {
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
  } catch (_e) {}
  return dateStr;
}

export async function generateStaticParams() {
  const { data } = getLatestEbirdData();
  const submissionIds = new Set(data.map((obs) => obs.SubmissionID).filter(Boolean));
  return Array.from(submissionIds).map((id) => ({
    id: id as string,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: submissionId } = await params;
  const { data } = getLatestEbirdData();
  const checklistData = data.filter((obs) => obs.SubmissionID === submissionId);

  if (checklistData.length === 0) {
    return { title: 'Checklist Not Found' };
  }

  const meta = checklistData[0];
  const options = getSiteOptions();
  return {
    title: `${formatDate(meta.Date)} · ${meta.Location} | ${options.title}`,
    description: `${checklistData.length} species recorded at ${meta.Location} on ${formatDate(meta.Date)}.`,
  };
}

// Next.js dynamic route params
export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const submissionId = resolvedParams.id;

  const { data } = getLatestEbirdData();
  const { data: allMediaData } = getLatestEbirdMediaData();

  // Find all observations for this checklist
  const checklistData = data.filter(obs => obs.SubmissionID === submissionId);
  const checklistMedia = allMediaData.filter(m => m.eBirdChecklistID === submissionId);

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
  const formattedDate = formatDate(meta.Date);

  // Group official location string (e.g. County, State, Country/Region)
  const officialGeographicalName = [meta.County, meta.StateProvince].filter(Boolean).join(', ');

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-white text-black">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Navigation */}
        <div className="flex justify-between items-center bg-white p-4 border border-black hover:bg-gray-50 transition-colors">
          <Link
            href={`/?locationId=${meta.LocationID}`}
            className="flex items-center text-black font-mono text-sm w-full"
          >
            <ChevronLeftIcon className="mr-2" />
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
            <h2 className="text-2xl md:text-3xl font-bold font-serif">{meta.Location}</h2>
            {officialGeographicalName && (
              <p className="text-gray-600 font-mono text-sm">{officialGeographicalName}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4 font-mono text-sm">
            {meta.NumberOfObservers && (
              <div className="flex items-start">
                <div className="w-8 text-gray-500 flex-shrink-0">
                  <PersonIcon />
                </div>
                <div>{meta.NumberOfObservers} Observer{parseInt(meta.NumberOfObservers) > 1 ? 's' : ''}</div>
              </div>
            )}

            {meta.Protocol && (
              <div className="flex items-start">
                <div className="w-8 text-gray-500 flex-shrink-0">
                  <ClockIcon />
                </div>
                <div>
                  {meta.Protocol}
                  {meta.AllObsReported === '0' && (
                    <Badge variant="inverted" className="ml-2">Incomplete</Badge>
                  )}
                </div>
              </div>
            )}

            {meta.ChecklistComments && (
              <div className="flex items-start">
                <div className="w-8 text-gray-500 flex-shrink-0 mt-0.5">
                  <CommentIcon />
                </div>
                <div className="text-gray-800">{meta.ChecklistComments}</div>
              </div>
            )}
          </div>
        </div>

        {/* Species List & Media */}
        <ChecklistClientView checklistData={checklistData} mediaData={checklistMedia} />
      </div>
    </main>
  );
}
