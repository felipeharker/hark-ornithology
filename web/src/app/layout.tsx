import type { Metadata } from "next";
import { Archivo, Roboto_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], weight: ["400", "600", "800"], variable: '--font-archivo' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: '--font-roboto-mono' });

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
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${robotoMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
