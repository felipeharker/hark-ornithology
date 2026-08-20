import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Inter, EB_Garamond, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const garamond = EB_Garamond({ subsets: ["latin"], variable: '--font-serif' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: '--font-mono' });

import { getSiteOptions } from "@/lib/parseOptions";

export async function generateMetadata(): Promise<Metadata> {
  const options = getSiteOptions();
  const description = "Personal birding project visualizing eBird data";
  return {
    title: options.title,
    description,
    openGraph: { title: options.title, description, type: 'website' },
    twitter: { card: 'summary', title: options.title, description },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const options = getSiteOptions();
  // Exposed as a CSS var so every component can use the site's configured
  // accent color (public/options.csv) via `text-[var(--accent)]` etc.,
  // instead of threading it through props or inline styles everywhere.
  const accentStyle = { '--accent': options.secondaryColorHex } as CSSProperties;

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${garamond.variable} ${robotoMono.variable} font-serif antialiased`}
        style={accentStyle}
      >
        {children}
      </body>
    </html>
  );
}
