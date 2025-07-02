import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // Note: i18n configuration is not supported in App Router
  // We handle internationalization manually in middleware and components

  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Server external packages
  serverExternalPackages: ['@google-cloud/text-to-speech'],

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/admin',
        permanent: true,
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        perf_hooks: false,
        child_process: false,
        worker_threads: false,
        cluster: false,
        dgram: false,
        dns: false,
        http2: false,
        inspector: false,
        module: false,
        repl: false,
        readline: false,
        vm: false,
        'node:perf_hooks': false,
        'node:fs': false,
        'node:path': false,
        'node:url': false,
        'node:buffer': false,
        'node:process': false,
        'node:stream': false,
        'node:util': false,
        'node:events': false,
        'node:crypto': false,
        'node:os': false,
        'node:child_process': false,
        'node:worker_threads': false,
        'node:cluster': false,
        'node:dgram': false,
        'node:dns': false,
        'node:http': false,
        'node:https': false,
        'node:http2': false,
        'node:net': false,
        'node:tls': false,
        'node:inspector': false,
        'node:module': false,
        'node:repl': false,
        'node:readline': false,
        'node:vm': false,
      };
    }
    return config;
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
});

export default withMDX(nextConfig);
