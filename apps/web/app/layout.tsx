import type { Metadata, Viewport } from 'next';
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
      <body className="min-h-screen bg-bg text-white font-display">{children}</body>
    </html>
  );
}
