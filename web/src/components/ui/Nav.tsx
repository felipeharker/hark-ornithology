import Link from 'next/link';
import { SITE_LINKS, externalLinkProps } from '@/lib/siteLinks';

/**
 * Top bar for interior pages (checklist reports, design standards).
 * The homepage uses its own table of contents instead — see HomeDocument.
 */
export function Nav({ siteTitle }: { siteTitle: string }) {
  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        {siteTitle}
      </Link>
      <a href={SITE_LINKS.repository} {...externalLinkProps(SITE_LINKS.repository)}>
        GitHub
      </a>
    </nav>
  );
}
