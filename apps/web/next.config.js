/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ksero-se/types'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

module.exports = nextConfig;
