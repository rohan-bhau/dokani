import type { NextConfig } from 'next';
import { env } from './src/config/env';

const apiBaseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  reactStrictMode: true,
  transpilePackages: ['@dokani/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${apiBaseUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
