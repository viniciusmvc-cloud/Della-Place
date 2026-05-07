/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 19 + Strict Mode
  reactStrictMode: true,

  // PWA Support
  headers: async () => {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },

  // Imagens otimizadas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Segurança e headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // Redirects (se necessário)
  async redirects() {
    return []
  },

  // Rewrites (se necessário)
  async rewrites() {
    return {
      beforeFiles: [],
    }
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'Della Pace - Pizzeria Artigianale',
  },

  // SWC minification (padrão, mais rápido)
  swcMinify: true,

  // Production source maps
  productionBrowserSourceMaps: false,

  // Compression
  compress: true,

  // PoweredByHeader
  poweredByHeader: false,

  // Trailing slash
  trailingSlash: false,

  // HTTPS redirect
  redirectHttpToHttps: process.env.NODE_ENV === 'production',
}

module.exports = nextConfig
