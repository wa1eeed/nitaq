import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@naqla/shared-ui'],
  webpack: (config) => {
    // date-fns is a dep of shared-utils but pnpm does not hoist it to root
    // node_modules; webpack must also look in shared-utils' own node_modules
    config.resolve.modules = [
      path.resolve(__dirname, '../../packages/shared-utils/node_modules'),
      ...config.resolve.modules,
    ];
    return config;
  },
};
export default withNextIntl(nextConfig);
