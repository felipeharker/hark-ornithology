import React from 'react';

/**
 * The title block at the top of a page.
 *
 * Two alignments, one component:
 *
 *   align="center"  the homepage, where the block is a publication front page
 *   align="left"    checklist and reference pages, where it heads a record
 *
 * Before this existed each page assembled the same five elements by hand, and
 * they had already drifted — one page centred its dateline, another did not.
 * Passing only the fields a page actually has keeps them in step: anything
 * omitted renders nothing rather than an empty line.
 *
 * Styling: section 3 of src/app/styles_primary.css.
 */

interface MastheadProps {
  /** Small tracked caps above the title. */
  kicker?: string;
  title: string;
  subtitle?: string;
  byline?: string;
  /** The one line of the block that is a recorded value, so it is set in mono. */
  dateline?: React.ReactNode;
  align?: 'center' | 'left';
  /** Extra content below the block — the checklist page's record grid. */
  children?: React.ReactNode;
}

export function Masthead({
  kicker,
  title,
  subtitle,
  byline,
  dateline,
  align = 'center',
  children,
}: MastheadProps) {
  return (
    <header className={align === 'left' ? 'masthead--left' : undefined}>
      {kicker && <p className="kicker">{kicker}</p>}
      <h1 className="title">{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {byline && <p className="byline">{byline}</p>}
      {dateline && <p className="dateline">{dateline}</p>}
      {children}
    </header>
  );
}
