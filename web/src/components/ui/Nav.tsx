import Link from 'next/link';

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
      <a href="https://github.com/felipeharker/hark-ornithology" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </nav>
  );
}
