import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

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
    <html lang="en">
      <body className="min-h-screen bg-bg text-white font-display">
        {children}
        <Script src="https://cdn.cookiehub.eu/c2/0cd5ea0b.js" strategy="afterInteractive" />
        <Script id="cookiehub-init" strategy="afterInteractive">
          {`var cpm = {}; window.cookiehub.load(cpm);`}
        </Script>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
    </html>
  );
}
