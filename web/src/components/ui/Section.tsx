import React from 'react';

/**
 * Section primitives.
 *
 * Every top-level block on the site is one of three things, and all three are
 * declared here so their markup can never drift apart page to page:
 *
 *   <Section>            a plain block with a heading
 *   <DisclosureSection>  a whole section that collapses (the location index)
 *   <Disclosure>         a subsection that collapses (one media group)
 *
 * Sections are not numbered. The heading and the contents list carry the same
 * name, which is all a reader needs to find their way; a numeral in front of
 * it was one more thing to read and one more thing to keep in sync.
 *
 * Styling: section 6 (headings) and section 11 (disclosures) of
 * src/app/styles_primary.css.
 */

interface SectionProps {
  /** Anchor target, so the table of contents can link to this section. */
  id?: string;
  title: string;
  children: React.ReactNode;
}

/** A plain titled block. */
export function Section({ id, title, children }: SectionProps) {
  return (
    <section className="section" id={id}>
      <h2 className="section-heading">{title}</h2>
      {children}
    </section>
  );
}

/**
 * The Show / Hide affordance at the right-hand end of every summary line.
 *
 * Both labels are always in the markup; CSS shows whichever matches the
 * disclosure's open state, so no JavaScript is needed to keep them in step.
 * It names the action only — a count here ("Show 22 photos") just repeated
 * what opening the section shows anyway.
 */
function DisclosureHint() {
  return (
    <span className="disclosure-hint">
      <span className="hint-closed">Show</span>
      <span className="hint-open">Hide</span>
    </span>
  );
}

interface DisclosureSectionProps extends SectionProps {
  /**
   * Controlled open state. The location index needs this because selecting a
   * map pin has to expand the section from outside it; every other disclosure
   * on the site is left to the browser.
   */
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

/** A whole section whose body collapses behind its heading. */
export function DisclosureSection({ id, title, open, onToggle, children }: DisclosureSectionProps) {
  return (
    <section className="section" id={id}>
      <details
        className="disclosure"
        open={open}
        onToggle={(e) => onToggle?.((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary>
          <span className="disclosure-heading">
            <span>{title}</span>
            <DisclosureHint />
          </span>
        </summary>
        <div className="disclosure-body">{children}</div>
      </details>
    </section>
  );
}

interface DisclosureProps {
  title: string;
  children: React.ReactNode;
}

/** A subsection within a section — one media group per checklist. */
export function Disclosure({ title, children }: DisclosureProps) {
  return (
    <details className="disclosure disclosure--sub">
      <summary>
        <span className="disclosure-heading">
          <span>{title}</span>
          <DisclosureHint />
        </span>
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
