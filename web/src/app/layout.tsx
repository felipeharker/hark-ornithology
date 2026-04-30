import type { Metadata } from "next";
import { Inter, PT_Serif, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const ptSerif = PT_Serif({ weight: ['400', '700'], subsets: ["latin"], variable: '--font-serif' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "Hark Ornithology Report",
  description: "Personal birding project visualizing eBird data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${ptSerif.variable} ${robotoMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
