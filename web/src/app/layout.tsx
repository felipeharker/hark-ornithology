import type { Metadata } from "next";
import { Inter, EB_Garamond, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const garamond = EB_Garamond({ subsets: ["latin"], variable: '--font-serif' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: '--font-mono' });

import { getSiteOptions } from "@/lib/parseOptions";

export async function generateMetadata(): Promise<Metadata> {
  const options = getSiteOptions();
  return {
    title: options.title,
    description: "Personal birding project visualizing eBird data",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${garamond.variable} ${robotoMono.variable} font-serif antialiased`}>{children}</body>
    </html>
  );
}
