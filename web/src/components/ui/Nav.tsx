import Link from 'next/link';
import { SITE_LINKS, SITE_TITLE, externalLinkProps } from '@/lib/siteConfig';

/**
 * Top bar for interior pages (checklist reports, design standards).
 * The homepage uses its own table of contents instead — see HomeDocument.
 */
export function Nav() {
  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        {SITE_TITLE}
      </Link>
      <a href={SITE_LINKS.repository} {...externalLinkProps(SITE_LINKS.repository)}>
        GitHub
      </a>
    </nav>
  );
}
