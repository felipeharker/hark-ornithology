import type { Metadata } from 'next';
import { getLatestEbirdData } from '@/lib/parseEbirdData';
import { getLatestEbirdMediaData } from '@/lib/parseEbirdMediaData';
import { getSiteOptions } from '@/lib/parseOptions';
import { formatDate } from '@/lib/formatDate';
import ChecklistDocument from '@/components/ChecklistDocument';
import { Nav } from '@/components/ui/Nav';
import Link from 'next/link';

export async function generateStaticParams() {
  const { data } = getLatestEbirdData();
  const submissionIds = new Set(data.map((obs) => obs.SubmissionID).filter(Boolean));
  return Array.from(submissionIds).map((id) => ({ id: id as string }));
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

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: submissionId } = await params;
  const { data } = getLatestEbirdData();
  const { data: allMediaData } = getLatestEbirdMediaData();
  const options = getSiteOptions();

  const checklistData = data.filter((obs) => obs.SubmissionID === submissionId);
  const checklistMedia = allMediaData.filter((m) => m.eBirdChecklistID === submissionId);

  if (checklistData.length === 0) {
    return (
      <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', minHeight: '100vh' }}>
        <Nav siteTitle={options.title} />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
          <h1>Checklist Not Found</h1>
          <p>The checklist ID {submissionId} could not be found in the dataset.</p>
          <Link href="/" className="btn btn-primary">Return to Homepage</Link>
        </main>
      </div>
    );
  }

  const meta = checklistData[0];
  const place = [meta.County, meta.StateProvince].filter(Boolean).join(', ');
  const incomplete = meta.AllObsReported === '0';

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', minHeight: '100vh' }}>
      <Nav siteTitle={options.title} />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-8) var(--space-4) calc(var(--space-8) * 2)', lineHeight: 1.6 }}>
        <Link href={`/?locationId=${meta.LocationID}`} style={{ fontSize: 14 }}>← Back to Location Index</Link>

        <header style={{ marginTop: 'var(--space-4)', paddingBottom: 'var(--space-6)', borderBottom: '2px solid var(--color-divider)' }}>
          <div className="hk-label">Checklist Report</div>
          <h1 style={{ margin: 'var(--space-2) 0 2px' }}>{meta.Location}</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.7 }}>
            {place} · {formatDate(meta.Date)} · {meta.Time}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr',
              gap: 'var(--space-2) var(--space-4)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              borderTop: '1px solid var(--color-divider)',
              paddingTop: 'var(--space-4)',
              marginTop: 'var(--space-4)',
            }}
          >
            <div className="hk-label" style={{ alignSelf: 'baseline' }}>Protocol</div>
            <div>{meta.Protocol}</div>
            <div className="hk-label" style={{ alignSelf: 'baseline' }}>Effort</div>
            <div>{meta.DurationMin} min · {meta.DistanceTraveledKm} km</div>
            <div className="hk-label" style={{ alignSelf: 'baseline' }}>Observers</div>
            <div>{meta.NumberOfObservers}</div>
            {incomplete && (
              <>
                <div className="hk-label" style={{ alignSelf: 'baseline' }}>Status</div>
                <div><span className="tag tag-outline">Incomplete</span></div>
              </>
            )}
            {meta.ChecklistComments && (
              <>
                <div className="hk-label" style={{ alignSelf: 'baseline' }}>Comments</div>
                <div>{meta.ChecklistComments}</div>
              </>
            )}
          </div>
        </header>

        <ChecklistDocument species={checklistData} media={checklistMedia} />
      </main>
    </div>
  );
}
