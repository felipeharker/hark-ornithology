import type { Metadata } from 'next';
import { STIX_Two_Text, Courier_Prime } from 'next/font/google';
import { getSiteOptions } from '@/lib/parseOptions';

// The two faces the design uses: a serif for prose, a monospace for recorded
// data. They are exposed as CSS variables and consumed by --font-body /
// --font-mono in styles_primary.css.
import './styles_primary.css';
import './styles_map.css';

const stix = STIX_Two_Text({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-stix',
});

const courier = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-courier',
});

export async function generateMetadata(): Promise<Metadata> {
  const options = getSiteOptions();
  const description = 'Personal birding project visualizing eBird observation data.';
  return {
    title: options.title,
    description,
    openGraph: { title: options.title, description, type: 'website' },
    twitter: { card: 'summary', title: options.title, description },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const options = getSiteOptions();

  return (
    <html lang="en">
      {/* The configured accent colour from public/options.csv is applied once,
          here, as a --color-accent override. Every accent in the stylesheets
          derives from it. */}
      <body
        className={`${stix.variable} ${courier.variable}`}
        style={{ '--color-accent': options.accentColorHex } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
