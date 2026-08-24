import React from 'react';

/**
 * Section primitives.
 *
 * Every block on the site is one of two things, and both are declared here so
 * their markup can never drift apart page to page:
 *
 *   <Section>     a plain block with a heading
 *   <Disclosure>  a row inside a section that collapses — one location, one
 *                 media group
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
 * what opening the row shows anyway.
 */
function DisclosureHint() {
  return (
    <span className="disclosure-hint">
      <span className="hint-closed">Show</span>
      <span className="hint-open">Hide</span>
    </span>
  );
}

interface DisclosureProps {
  title: string;
  /**
   * Controlled open state. Media groups pass neither prop and are left to the
   * browser. The location list passes both, because a location also opens
   * from outside its own row — a map pin, or a ?locationId= link — and only
   * one location is open at a time.
   */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  /** Scroll target; React 19 takes a ref on a function component as a prop. */
  ref?: React.Ref<HTMLDetailsElement>;
  children: React.ReactNode;
}

/** One collapsible row within a section. */
export function Disclosure({ title, open, onToggle, ref, children }: DisclosureProps) {
  return (
    <details
      className="disclosure"
      ref={ref}
      open={open}
      onToggle={(e) => onToggle?.((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <span className="disclosure-heading">
          <span className="disclosure-title">{title}</span>
          <DisclosureHint />
        </span>
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
