import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Rubik, Space_Grotesk, Fredoka, Nunito } from 'next/font/google';
import AnalyticsConsent from '../components/AnalyticsConsent';
import './globals.css';

// Self-hosted, non-render-blocking fonts (swap so text paints immediately).
// Exposed as CSS variables consumed by globals.css and lib/y2k.ts.
const rubik = Rubik({ subsets: ['latin'], weight: ['400', '500', '700', '900'], variable: '--font-rubik', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-space-grotesk', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-fredoka', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-nunito', display: 'swap' });

const fontVars = `${rubik.variable} ${spaceGrotesk.variable} ${fredoka.variable} ${nunito.variable}`;

export const metadata: Metadata = {
  metadataBase: new URL('https://kserose.com'),
  title: 'KseroSe: how well do you know each other?',
  description: 'A party guessing game. Host it on a TV and play on your phone. Join with a room code.',
  openGraph: {
    title: 'KseroSe: how well do you know each other?',
    description: 'A party guessing game. Host it on a TV and play on your phone.',
    url: 'https://kserose.com',
    siteName: 'KseroSe',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'KseroSe party game' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KseroSe: how well do you know each other?',
    description: 'A party guessing game. Host it on a TV and play on your phone.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0d0818',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={fontVars}>
      <body className="min-h-screen bg-bg text-white font-display">
        <Script id="consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
        </Script>
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
