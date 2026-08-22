import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteOptions } from '@/lib/parseOptions';
import { Nav } from '@/components/ui/Nav';

export async function generateMetadata(): Promise<Metadata> {
  const options = getSiteOptions();
  return { title: `Design Standards | ${options.title}` };
}

/** Role, family, size — mirrors the type scale tokens in styles_primary.css. */
const TYPE_ROWS: [string, string, string][] = [
  ['Page title', 'STIX Two Text', '40px'],
  ['Section heading', 'STIX Two Text', '27px'],
  ['Subsection heading', 'STIX Two Text', '21px'],
  ['Body text', 'STIX Two Text', '18px'],
  ['Abstract', 'STIX Two Text', '17px'],
  ['Table text', 'STIX Two Text', '16px'],
  ['Recorded data (dates, counts, coordinates)', 'Courier Prime', '13px'],
  ['Caption, dateline', 'Courier Prime', '13px'],
  ['Scientific name', 'Courier Prime italic', '12px'],
  ['Eyebrow label', 'Courier Prime', '11px'],
];

const SWATCHES: [string, string][] = [
  ['bg', 'var(--color-bg)'],
  ['surface', 'var(--color-surface)'],
  ['text', 'var(--color-text)'],
  ['text-mute', 'var(--color-text-mute)'],
  ['rule-soft', 'var(--color-rule-soft)'],
  ['accent', 'var(--color-accent)'],
];

export default function DesignStandardsPage() {
  const options = getSiteOptions();

  return (
    <>
      <Nav siteTitle={options.title} />
      <article className="doc doc--interior">
        <Link href="/#sec-refs" className="backlink">
          ← Back to Reference
        </Link>

        <header className="masthead--left">
          <p className="kicker">Reference [2]</p>
          <h1 className="title">Design Standards</h1>
          <p className="dateline">Type, color, spacing and document conventions used site-wide.</p>
        </header>

        <section className="section">
          <h2 className="section-heading">
            <span className="num">1</span>
            <span>Shared Language</span>
          </h2>
          <p className="body-text">
            This site and its sibling project, <i>Alexandria Library</i>, share one visual
            language: a printed technical paper. Serif prose, a monospace face reserved for
            recorded data, black rules instead of boxes and shadows, and a single deep red used
            sparingly. Where this site has a component the other does not — the map, the media
            grids, the checklist records — that component is styled to the same rules rather than
            introducing a second idiom.
          </p>
          <p className="body-text">
            Every rule lives in two annotated stylesheets: <code>src/app/styles_primary.css</code>{' '}
            for the site, and <code>src/app/styles_map.css</code> for the map. Both open with a
            block of custom properties; restyling means changing a token, not hunting through
            rules.
          </p>
        </section>

        <section className="section">
          <h2 className="section-heading">
            <span className="num">2</span>
            <span>Type</span>
          </h2>
          <p className="body-text">
            STIX Two Text carries every heading and every line of prose. Courier Prime is reserved
            for data — dates, times, counts, coordinates, scientific names — plus captions and
            eyebrow labels, so a reader can tell a recorded value from a written sentence at a
            glance.
          </p>

          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Family</th>
                  <th className="num-cell">Size</th>
                </tr>
              </thead>
              <tbody>
                {TYPE_ROWS.map(([role, family, size]) => (
                  <tr key={role}>
                    <td>{role}</td>
                    <td>{family}</td>
                    <td className="num-cell">{size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption">
            Table 1 — the complete type scale, declared as <code>--size-*</code> tokens.
          </p>
        </section>

        <section className="section">
          <h2 className="section-heading">
            <span className="num">3</span>
            <span>Spacing &amp; Rules</span>
          </h2>
          <p className="body-text">
            Every margin, padding and gap comes from the <code>--space-*</code> scale — never a
            bare pixel value. Two rule weights carry all structure: a 2px rule between major
            sections and around the masthead and colophon, and a 1px rule between rows within a
            section.
          </p>

          <div className="specimens">
            <div className="specimen">
              <hr className="rule" />
              <p className="caption">2px — major division</p>
            </div>
            <div className="specimen">
              <hr className="rule-soft" />
              <p className="caption">1px — row division</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-heading">
            <span className="num">4</span>
            <span>Color</span>
          </h2>
          <p className="body-text">
            A white ground with one accent, used sparingly: links, section numerals in the table
            of contents, the selected map pin, and the disclosure hints. The accent is configurable
            per-site via <code>accent color hex</code> in <code>public/options.csv</code>; the
            hover step is derived from it, so both move together.
          </p>
          <div className="swatches">
            {SWATCHES.map(([label, color]) => (
              <div key={label}>
                <div className="swatch" style={{ background: color }} />
                <p className="caption">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-heading">
            <span className="num">5</span>
            <span>Document Conventions</span>
          </h2>
          <ul className="list">
            <li>
              Content flows as numbered sections (1., 2., 3. …), indexed by a table of contents at
              the top of the page.
            </li>
            <li>
              A section whose content is long — the location index, a checklist&rsquo;s photos —
              is a native <code>&lt;details&gt;</code> disclosure that opens on click, so the page
              starts short.
            </li>
            <li>
              Every figure and table carries a caption below it, in sentence case:
              &ldquo;Figure N — …&rdquo; or &ldquo;Table N — …&rdquo;.
            </li>
            <li>References are numbered like a bibliography: &ldquo;[N] Label — description.&rdquo;</li>
            <li>
              Prose and data are sourced from files, never hardcoded: CSV exports for observations
              and media, Markdown for the abstract and field notes.
            </li>
          </ul>
        </section>

        <p className="colophon">
          Applies to every page in this project — <Link href="/">{options.title}</Link>.
        </p>
      </article>
    </>
  );
}
