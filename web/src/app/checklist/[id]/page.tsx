import type { Metadata } from 'next';
import Link from 'next/link';
import { getObservations, getMedia } from '@/lib/parseEbird';
import { formatDate } from '@/lib/formatDate';
import { SITE_TITLE } from '@/lib/siteConfig';
import ChecklistDocument from '@/components/ChecklistDocument';
import { Nav } from '@/components/ui/Nav';
import { Masthead } from '@/components/ui/Masthead';

/** One static page per submitted checklist in the observation CSV. */
export async function generateStaticParams() {
  const submissionIds = new Set(
    getObservations().map((obs) => obs.SubmissionID).filter(Boolean)
  );
  return Array.from(submissionIds).map((id) => ({ id: id as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: submissionId } = await params;
  const checklistData = getObservations().filter((obs) => obs.SubmissionID === submissionId);

  if (checklistData.length === 0) {
    return { title: 'Checklist Not Found' };
  }

  const meta = checklistData[0];
  return {
    title: `${formatDate(meta.Date)} · ${meta.Location} | ${SITE_TITLE}`,
    description: `${checklistData.length} species recorded at ${meta.Location} on ${formatDate(meta.Date)}.`,
  };
}

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await params;

  const checklistData = getObservations().filter((obs) => obs.SubmissionID === submissionId);
  const checklistMedia = getMedia().filter((m) => m.eBirdChecklistID === submissionId);

  if (checklistData.length === 0) {
    return (
      <>
        <Nav />
        <article className="doc doc--interior">
          <Masthead align="left" kicker="Not Found" title="Checklist Not Found" />
          <p className="body-text">
            The checklist ID {submissionId} could not be found in the dataset.
          </p>
          <p className="body-text">
            <Link href="/">← Return to the report</Link>
          </p>
        </article>
      </>
    );
  }

  const meta = checklistData[0];
  const place = [meta.County, meta.StateProvince].filter(Boolean).join(', ');
  const incomplete = meta.AllObsReported === '0';
  // Casual observations record neither duration nor distance; showing the bare
  // units in that case reads as a rendering bug, so the row is omitted.
  const effort = [
    meta.DurationMin && `${meta.DurationMin} min`,
    meta.DistanceTraveledKm && `${meta.DistanceTraveledKm} km`,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <Nav />
      <article className="doc doc--interior">
        <Link href={`/?locationId=${meta.LocationID}`} className="backlink">
          ← Back to the location index
        </Link>

        <Masthead
          align="left"
          kicker="Checklist Report"
          title={meta.Location}
          dateline={`${place} · ${formatDate(meta.Date)} · ${meta.Time}`}
        >
          <dl className="record">
            <dt>Protocol</dt>
            <dd>{meta.Protocol}</dd>
            {effort && (
              <>
                <dt>Effort</dt>
                <dd>{effort}</dd>
              </>
            )}
            <dt>Observers</dt>
            <dd>{meta.NumberOfObservers}</dd>
            {incomplete && (
              <>
                <dt>Status</dt>
                <dd>
                  <span className="tag">Incomplete</span>
                </dd>
              </>
            )}
            {meta.ChecklistComments && (
              <>
                <dt>Comments</dt>
                <dd>{meta.ChecklistComments}</dd>
              </>
            )}
          </dl>
        </Masthead>

        <ChecklistDocument species={checklistData} media={checklistMedia} />

        <p className="colophon">
          Submission {submissionId} · recorded on eBird, rendered from the export in
          observation-data/.
        </p>
      </article>
    </>
  );
}
