import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/establishment/dashboard',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/establishment/dashboard/:path*',
        destination: '/dashboard/:path*',
        permanent: true,
      },
      {
        source: '/:locale/establishment/dashboard',
        destination: '/:locale/dashboard',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
