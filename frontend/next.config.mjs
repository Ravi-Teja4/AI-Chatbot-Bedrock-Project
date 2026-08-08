import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Strict Mode — catches lifecycle issues and deprecated APIs early.
   * Keep enabled in production; it runs twice in dev for double-invoke detection.
   */
  reactStrictMode: true,

  /**
   * Transpile the shared workspace package so Next.js processes
   * its TypeScript through its own compiler pipeline.
   */
  transpilePackages: ['@ai-chat/shared'],

  /**
   * Compiler options — remove console logs in production builds
   * while preserving error/warn for operational visibility.
   */
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  /**
   * Image optimization configuration.
   * Extend remotePatterns when integrating S3/CloudFront in future phases.
   */
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  /**
   * Security and performance HTTP headers applied to all routes.
   * These complement the backend Helmet middleware for the frontend delivery layer.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  /**
   * Rewrites for local development API proxying.
   * In production, NEXT_PUBLIC_API_URL points directly to the backend.
   * This rewrite only activates when NEXT_PUBLIC_API_URL is unset (local dev via docker compose).
   */
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  /**
   * Standalone output — required for Docker deployment.
   * Next.js traces all imported files and creates a minimal self-contained
   * server in .next/standalone. This reduces the production Docker image
   * from ~1GB to ~200MB by excluding unused node_modules.
   *
   * The output directory structure becomes:
   *   .next/standalone/   ← minimal server + traced deps
   *   .next/static/       ← static assets (copied separately in Dockerfile)
   *   public/             ← public assets (copied separately in Dockerfile)
   */
  output: 'standalone',

  /**
   * Experimental features.
   * typedRoutes: compile-time checking of Next.js route strings.
   */
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
