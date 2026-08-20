'use client';

import Link from 'next/link';
import { EbirdMediaObservation } from '@/lib/parseEbirdMediaData';
import { SectionHeading } from './ui/Panel';
import { MediaGrid } from './ui/MediaGrid';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface LocationSummary {
  id: string;
  name: string;
  count: number;
  isHotspot: boolean;
}

export interface ChecklistSummary {
  submissionId: string;
  date: string;
  time: string;
  hasMedia: boolean;
}

export interface SpeciesTotal {
  commonName: string;
  scientificName: string;
  total: number;
  onlyX: boolean;
}

export interface LocationMediaGroup {
  checklistId: string;
  date: string;
  time: string;
  items: EbirdMediaObservation[];
}

interface LocationDetailPanelProps {
  location: LocationSummary;
  checklists: ChecklistSummary[];
  totals: SpeciesTotal[];
  chartData: { date: string; count: number }[];
  chartColor: string;
  /** Omit entirely to hide the Media section (used by the map view, which links out to it instead). */
  media?: LocationMediaGroup[];
  onMediaSelect: (items: EbirdMediaObservation[], index: number) => void;
}

// Checklists + species totals + (optional) media + observations-over-time chart
// for one location. Shared by both the Map and Lists dashboard tabs so the two
// entry points always show identical, up-to-date detail.
export default function LocationDetailPanel({
  location,
  checklists,
  totals,
  chartData,
  chartColor,
  media,
  onMediaSelect,
}: LocationDetailPanelProps) {
  return (
    <div className="p-4 md:p-8 bg-white text-black">
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold font-serif">{location.name}</h2>
        <div className="font-mono text-sm mt-1 opacity-80">
          {location.count} {location.count === 1 ? 'Observation' : 'Observations'}
          {location.isHotspot && ' • Hotspot'}
        </div>
      </div>

      <div className="mb-8">
        <SectionHeading>Checklists</SectionHeading>
        {checklists.length > 0 ? (
          <div className="space-y-0 border-t border-gray-200">
            {checklists.map((checklist) => (
              <div key={checklist.submissionId} className="flex flex-row items-center border-b border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                <div className="font-mono text-sm mr-4 w-40">{checklist.date} {checklist.time}</div>
                <Link
                  href={`/checklist/${checklist.submissionId}?locationId=${location.id}`}
                  className="font-mono text-sm hover:underline text-[var(--accent)]"
                >
                  {checklist.hasMedia ? 'Checklist and Media' : 'Checklist'}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-gray-500 italic">No checklists available.</p>
        )}
      </div>

      <div className="mb-8">
        <SectionHeading>Species Totals</SectionHeading>
        <div className="overflow-x-auto border-t border-b border-black">
          <table className="min-w-full divide-y divide-gray-300 text-sm font-mono">
            <thead>
              <tr>
                <th className="px-2 py-3 text-left font-bold">Species</th>
                <th className="px-2 py-3 text-right font-bold">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {totals.map((item) => (
                <tr key={item.commonName}>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="font-bold">{item.commonName}</div>
                    <div className="text-xs italic text-gray-600">{item.scientificName}</div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-right font-bold">
                    {item.onlyX ? 'X' : item.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {media && (
        <div className="mb-8">
          <SectionHeading>Media</SectionHeading>
          {media.length > 0 ? (
            <div className="space-y-8">
              {media.map((group) => (
                <div key={group.checklistId} className="border border-black p-4 bg-white">
                  <div className="flex flex-row items-center justify-between mb-4 border-b border-black pb-2">
                    <div className="font-mono text-sm font-bold">{group.date} {group.time}</div>
                    <Link
                      href={`/checklist/${group.checklistId}?locationId=${location.id}`}
                      className="font-mono text-sm hover:underline text-[var(--accent)]"
                    >
                      Checklist
                    </Link>
                  </div>
                  <MediaGrid items={group.items} onSelect={(idx) => onMediaSelect(group.items, idx)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-gray-500 italic">No media available for this location.</p>
          )}
        </div>
      )}

      <div>
        <SectionHeading>Observations over Time (Month/Year)</SectionHeading>
        <div className="h-[400px] md:h-[500px] border border-black p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" tick={{ fontFamily: 'monospace', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontFamily: 'monospace', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid black', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="count" stroke={chartColor} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
