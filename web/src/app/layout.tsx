import type { Metadata } from "next";
import { Funnel_Display, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const display = Funnel_Display({ variable: "--font-display", subsets: ["latin"] });
const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "PERLE — Drop Oil",
  description: "PERLE Drop Oil: five oils, one drop. A fictional skincare brand, built as a portfolio piece.",
};

// decide on the intro before the first paint, so the type never shows and then hides
// (the script adds classes to <html>, hence suppressHydrationWarning)
const INTRO = `try { if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]poster/.test(location.search)) document.documentElement.classList.add('loading', 'naming'); } catch (e) {}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
