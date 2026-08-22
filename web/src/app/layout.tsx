import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import { getSiteOptions } from '@/lib/parseOptions';

import './styles_primary.css';
import './styles_map.css';

/**
 * The two faces the design uses.
 *
 * Inter carries everything a reader reads: headings, prose, tables, labels.
 * It is a neutral, low-contrast grotesque that stays legible at small sizes
 * and — unlike the serif this site used before — does not need to be set
 * large or bold to hold a heading together. Only three weights are loaded;
 * the design never asks for a fourth, and every extra weight is a font file
 * the visitor has to download.
 *
 * IBM Plex Mono is reserved for recorded values: dates, times, counts,
 * coordinates, scientific names. Its job is column alignment and signalling
 * "this is data, not a sentence" — not decoration, so it is deliberately
 * scarce.
 *
 * Both are exposed as CSS variables and consumed by --font-body / --font-mono
 * in styles_primary.css. next/font self-hosts the files at build time, so
 * there is no request to Google at runtime and no flash of unstyled text.
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-mono-face',
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
    /* The font variable classes go on <html>, not <body>, and that placement
       is load-bearing. next/font emits a class that declares --font-sans and
       --font-mono-face on whatever element carries it, while styles_primary.css
       composes --font-body from them inside its :root block — which *is*
       <html>. A custom property is substituted against the element it is
       declared on, so a --font-body built in :root out of variables that only
       exist further down the tree resolves to nothing at all: the declaration
       becomes invalid and every page silently falls back to the browser's
       default serif. Keeping the classes here means the variables and the
       token that consumes them live on the same element. */
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      {/* The configured accent colour from public/options.csv is applied once,
          here, as a --color-accent override. Every accent in the stylesheets
          derives from it. */}
      <body style={{ '--color-accent': options.accentColorHex } as React.CSSProperties}>
        {children}
      </body>
    </html>
  );
}
