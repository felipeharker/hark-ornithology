import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteOptions } from '@/lib/parseOptions';
import { Nav } from '@/components/ui/Nav';

export async function generateMetadata(): Promise<Metadata> {
  const options = getSiteOptions();
  return { title: `Design Standards | ${options.title}` };
}

const TYPE_ROWS: [string, string, string][] = [
  ['Lead paragraph (Abstract)', 'Archivo', '16px'],
  ['Body text', 'Archivo', '15px'],
  ['Section numeral (1. 2. 3.)', 'Roboto Mono', '15px'],
  ['Table & list text', 'Archivo', '14px'],
  ['Metadata & dateline', 'Roboto Mono', '13px'],
  ['Scientific name annotation', 'Roboto Mono italic', '12px'],
  ['Caption & eyebrow label', 'Roboto Mono', '11px'],
];

const swatches: [string, string][] = [
  ['bg', 'var(--color-bg)'],
  ['surface', 'var(--color-surface)'],
  ['text', 'var(--color-text)'],
  ['divider', 'var(--color-divider)'],
  ['accent', 'var(--color-accent)'],
  ['accent-700', 'var(--color-accent-700)'],
];

const sectionStyle = {
  marginTop: 'var(--space-8)',
  paddingTop: 'var(--space-6)',
  borderTop: '2px solid var(--color-divider)',
} as const;

export default function DesignStandardsPage() {
  const options = getSiteOptions();

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', minHeight: '100vh' }}>
      <Nav siteTitle={options.title} />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-8) var(--space-4) calc(var(--space-8) * 2)', lineHeight: 1.6 }}>
        <Link href="/#sec-refs" style={{ fontSize: 14 }}>← Back to Reference</Link>

        <header style={{ marginTop: 'var(--space-4)', paddingBottom: 'var(--space-6)', borderBottom: '2px solid var(--color-divider)' }}>
          <div className="hk-label">Reference [2]</div>
          <h1 style={{ margin: 'var(--space-2) 0 2px' }}>Design Standards</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.7 }}>Fonts, spacing and formatting used throughout this site.</div>
        </header>

        <section style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, opacity: 0.5 }}>1.</span>
            <h2 style={{ margin: 0 }}>Type</h2>
          </div>
          <p style={{ maxWidth: '68ch', marginTop: 'var(--space-2)' }}>
            Archivo carries every heading and every line of body prose. Roboto Mono is reserved for data — dates, times,
            counts, coordinates, scientific names — plus captions and section numerals, so a reader can tell a recorded
            value from a written sentence at a glance.
          </p>

          <table className="table" style={{ marginTop: 'var(--space-4)' }}>
            <thead><tr><th>Role</th><th>Family</th><th style={{ textAlign: 'right' }}>Size</th></tr></thead>
            <tbody>
              {TYPE_ROWS.map(([role, family, size]) => (
                <tr key={role}>
                  <td>{role}</td>
                  <td>{family}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{size}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="hk-figcap" style={{ marginTop: 'var(--space-2)' }}>
            Table 1 — the site&rsquo;s complete type scale. Headings keep the base stylesheet&rsquo;s sizes (h1 42px, h2 32px, h3 25px) unmodified.
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, opacity: 0.5 }}>2.</span>
            <h2 style={{ margin: 0 }}>Spacing &amp; Rules</h2>
          </div>
          <p style={{ maxWidth: '68ch', marginTop: 'var(--space-2)' }}>
            Every margin, padding and gap comes from the <code>--space-*</code> scale — never a bare pixel value. Two rule
            weights carry all structure: a 2px divider between major sections and around the masthead and footer, and a
            1px divider between rows within a section.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-4)', alignItems: 'flex-end' }}>
            <div>
              <div style={{ width: 160, borderTop: '2px solid var(--color-text)' }} />
              <div className="hk-figcap" style={{ marginTop: 'var(--space-2)' }}>2px — major divider</div>
            </div>
            <div>
              <div style={{ width: 160, borderTop: '1px solid var(--color-divider)' }} />
              <div className="hk-figcap" style={{ marginTop: 'var(--space-2)' }}>1px — row divider</div>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, opacity: 0.5 }}>3.</span>
            <h2 style={{ margin: 0 }}>Color</h2>
          </div>
          <p style={{ maxWidth: '68ch', marginTop: 'var(--space-2)' }}>
            A light ground with one accent, used sparingly: the active item in the section nav, hotspot tags, and small
            emphasis. Paragraph-size accent text always uses the deeper <code>accent-700</code> step, never the bare
            accent, to hold contrast.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            {swatches.map(([label, color]) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ height: 40, background: color, border: '1px solid var(--color-divider)' }} />
                <div className="hk-figcap" style={{ marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, opacity: 0.5 }}>4.</span>
            <h2 style={{ margin: 0 }}>Document Conventions</h2>
          </div>
          <ul style={{ maxWidth: '68ch', margin: 'var(--space-2) 0 0', paddingLeft: '1.1em', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <li>Content flows as numbered sections (1., 2., 3. …) that stay open — no tabs or accordions at the top level.</li>
            <li>The one exception is a table row, such as a location: it may disclose supplementary detail on click.</li>
            <li>Every figure and table carries a caption below it, in sentence case: &ldquo;Figure N — …&rdquo; or &ldquo;Table N — …&rdquo;.</li>
            <li>References are numbered like a bibliography: &ldquo;[N] Label — description.&rdquo;</li>
          </ul>
        </section>

        <footer style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-divider)', fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.55 }}>
          Applies to every page in this project — <Link href="/">{options.title}</Link>.
        </footer>
      </main>
    </div>
  );
}
