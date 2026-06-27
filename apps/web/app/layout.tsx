import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Rubik, Space_Grotesk, Fredoka, Nunito } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

// Self-hosted, non-render-blocking fonts (swap so text paints immediately).
// Exposed as CSS variables consumed by globals.css and lib/y2k.ts.
const rubik = Rubik({ subsets: ['latin'], weight: ['400', '500', '700', '900'], variable: '--font-rubik', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-space-grotesk', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-fredoka', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-nunito', display: 'swap' });

const fontVars = `${rubik.variable} ${spaceGrotesk.variable} ${fredoka.variable} ${nunito.variable}`;

export const metadata: Metadata = {
  title: 'KseroSe — How well do you know each other?',
  description: 'A Jackbox-style social guessing game. Join via QR code on your phone.',
};

export const viewport: Viewport = {
  themeColor: '#0d0818',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body className="min-h-screen bg-bg text-white font-display">
        {children}
        <Script src="https://cdn.cookiehub.eu/c2/0cd5ea0b.js" strategy="afterInteractive" />
        <Script id="cookiehub-init" strategy="afterInteractive">
          {`var cpm = {}; if (window.cookiehub) window.cookiehub.load(cpm);`}
        </Script>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
    </html>
  );
}
