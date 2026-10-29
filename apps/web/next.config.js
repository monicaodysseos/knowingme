/** @type {import('next').NextConfig} */

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
let httpOrigin = 'http://localhost:3001';
let wsOrigin = 'ws://localhost:3001';
try {
  const parsed = new URL(serverUrl);
  httpOrigin = parsed.origin;
  wsOrigin = parsed.origin.replace(/^http/, 'ws');
} catch {
  /* keep the local default */
}

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  'https://cdn.cookiehub.eu',
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
].join(' ');

const connectSrc = [
  "'self'",
  httpOrigin,
  wsOrigin,
  'https://kserose.com',
  'https://www.kserose.com',
  'https://cdn.cookiehub.eu',
  'https://*.cookiehub.eu',
  'https://*.cookiehub.net',
  'https://www.google-analytics.com',
  'https://region1.google-analytics.com',
  'https://www.googletagmanager.com',
].join(' ');

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com",
  `connect-src ${connectSrc}`,
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig = {
  transpilePackages: ['@ksero-se/types'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
