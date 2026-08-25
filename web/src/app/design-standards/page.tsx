import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_TITLE } from '@/lib/siteConfig';
import { Nav } from '@/components/ui/Nav';
import { Masthead } from '@/components/ui/Masthead';
import { Section } from '@/components/ui/Section';

export const metadata: Metadata = { title: `Design Standards | ${SITE_TITLE}` };

/** Role, family, size — mirrors the type scale tokens in styles_primary.css. */
const TYPE_ROWS: [string, string, string][] = [
  ['Page title', 'Inter Semibold', '34px'],
  ['Section heading', 'Inter Semibold', '23px'],
  ['Subsection heading', 'Inter Medium', '17px'],
  ['Body text', 'Inter Regular', '16px'],
  ['Table text', 'Inter Regular', '15px'],
  ['Caption, description', 'Inter Regular', '13px'],
  ['Recorded data (dates, counts, coordinates)', 'IBM Plex Mono', '13px'],
  ['Scientific name', 'IBM Plex Mono Italic', '12px'],
  ['Eyebrow label, table header', 'Inter Medium', '11px'],
];

/** Weight, token, and what each is for. Nothing on the site is set bolder. */
const WEIGHT_ROWS: [string, string, string][] = [
  ['400', '--weight-regular', 'Body copy, table cells, everything read at length.'],
  ['500', '--weight-medium', 'Noticed but not a heading: table headers, selected rows, buttons, labels.'],
  ['600', '--weight-strong', 'Headings and the page title. The heaviest weight on the site.'],
];

const SWATCHES: [string, string][] = [
  ['bg', 'var(--color-bg)'],
  ['surface', 'var(--color-surface)'],
  ['text', 'var(--color-text)'],
  ['text-soft', 'var(--color-text-soft)'],
  ['text-mute', 'var(--color-text-mute)'],
  ['rule', 'var(--color-rule)'],
  ['rule-strong', 'var(--color-rule-strong)'],
  ['accent', 'var(--color-accent)'],
];

export default function DesignStandardsPage() {
  return (
    <>
      <Nav />
      <article className="doc doc--interior">
        <Link href="/#sec-refs" className="backlink">
          ← Back to Reference
        </Link>

        <Masthead
          align="left"
          kicker="Reference"
          title="Design Standards"
          dateline="Type, color, spacing and document conventions used site-wide."
        />

        <Section title="Visual Language">
          <p className="body-text">
            This site is one visual language: a quiet, modern document. A neutral sans carries
            every heading and every line of prose; a monospace face is reserved for recorded
            values, where column alignment matters and a reader benefits from seeing at a glance
            that something is data rather than a sentence. Structure comes from hairline rules
            and whitespace rather than heavy bars, boxes or shadows, and a single deep red is
            the only accent.
          </p>
          <p className="body-text">
            The pieces particular to this site — the map, the media grids, the checklist
            records — are styled to those same rules rather than introducing a second idiom.
          </p>
          <p className="body-text">
            Every rule lives in two annotated stylesheets: <code>src/app/styles_primary.css</code>{' '}
            for the site, and <code>src/app/styles_map.css</code> for the map. Both open with a
            block of custom properties; restyling means changing a token, not hunting through
            rules.
          </p>
        </Section>

        <Section title="Type">
          <p className="body-text">
            Inter carries every heading and every line of prose. IBM Plex Mono is reserved for
            data — dates, times, counts, coordinates, scientific names — so a reader can tell a
            recorded value from a written sentence at a glance. Anything that is not prose sits
            a step down in colour, which is most of what keeps the page feeling light.
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
            The complete type scale, declared as <code>--size-*</code> tokens.
          </p>
        </Section>

        <Section title="Weight">
          <p className="body-text">
            Three weights, and no bold. The step from regular to semibold is enough to mark a
            heading when the type around it is calm, and a page that never reaches for 700 reads
            lighter without giving up its hierarchy.
          </p>

          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Weight</th>
                  <th>Token</th>
                  <th>Used for</th>
                </tr>
              </thead>
              <tbody>
                {WEIGHT_ROWS.map(([weight, token, usage]) => (
                  <tr key={token}>
                    <td>{weight}</td>
                    <td>
                      <code>{token}</code>
                    </td>
                    <td>{usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Spacing &amp; Rules">
          <p className="body-text">
            Every margin, padding and gap comes from the <code>--space-*</code> scale — never a
            bare pixel value. Both rule weights are hairlines: they differ in contrast, not
            thickness. A divider should tell a reader where a section ends without drawing
            attention to itself while doing it, so the space above a section, not the rule, is
            what separates it from the one before.
          </p>

          <div className="specimens">
            <div className="specimen">
              <hr className="rule" />
              <p className="caption">Section division — 1px, rule-strong</p>
            </div>
            <div className="specimen">
              <hr className="rule-soft" />
              <p className="caption">Row division — 1px, rule</p>
            </div>
          </div>
        </Section>

        <Section title="Color">
          <p className="body-text">
            A white ground with one accent, used sparingly and with one meaning: this is
            interactive, or this is selected. Links, the selected map pin, the selected location
            row and the disclosure hints carry it; nothing else does. It is set once, as the{' '}
            <code>--color-accent</code> token in <code>styles_primary.css</code>, and both the
            hover step and the faint wash behind a selected control are derived from it, so all
            three move together.
          </p>
          <div className="swatches">
            {SWATCHES.map(([label, color]) => (
              <div key={label}>
                <div className="swatch" style={{ background: color }} />
                <p className="caption">{label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Document Conventions">
          <ul className="list">
            <li>
              Content flows as named sections — Map, Locations, Media — indexed by a contents
              list at the top of the page. Nothing is numbered: the heading and the index entry
              carry the same name, which is all a reader needs to navigate by.
            </li>
            <li>
              A long list — the locations, the places with photos — is a list of rows, each
              a native <code>&lt;details&gt;</code> disclosure that opens in place, so the page
              starts as an index. A row&rsquo;s Show / Hide control names the action only, never
              a count.
            </li>
            <li>
              A figure or table carries a caption below it when the caption says something the
              content does not. Captions are sentence case and unnumbered.
            </li>
            <li>
              References are a plain list of links with a line of description each, gathered at
              the foot of the page. Nothing in the prose points at them with a superscript
              marker.
            </li>
            <li>
              Observations come from files, never from markup: CSV exports for the records and
              media, Markdown for the field notes. Only the project&rsquo;s own settings — its
              title, its abstract, its off-site links — are written in code, in{' '}
              <code>src/lib/siteConfig.ts</code>.
            </li>
          </ul>
        </Section>

        <p className="colophon">
          Applies to every page in this project — <Link href="/">{SITE_TITLE}</Link>.
        </p>
      </article>
    </>
  );
}
