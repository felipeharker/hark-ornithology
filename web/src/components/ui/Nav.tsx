import Link from 'next/link';

// Top bar used on detail pages (Checklist, Design Standards). The Home page
// uses a sticky section sidebar instead — see HomeDocument.
export function Nav({ siteTitle }: { siteTitle: string }) {
  return (
    <nav className="nav">
      <Link href="/" className="nav-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        {siteTitle}
      </Link>
      <a
        href="https://github.com/felipeharker/hark-ornithology"
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary"
        style={{ marginLeft: 'auto' }}
      >
        GitHub
      </a>
    </nav>
  );
}
