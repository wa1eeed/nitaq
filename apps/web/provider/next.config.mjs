import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@naqla/shared-ui', '@naqla/shared-types', '@naqla/shared-utils'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'storage.naqla.nx.sa' },
    ],
  },
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, '../../packages/shared-utils/node_modules'),
      ...config.resolve.modules,
    ];
    return config;
  },
};
export default withNextIntl(nextConfig);
