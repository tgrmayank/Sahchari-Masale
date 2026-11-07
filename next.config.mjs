/** @type {import('next').NextConfig} */
// Private pages: tell search engines not to index them (same rule as the <meta robots> tag on each page)
const NOINDEX_PATHS = ['/cart', '/address', '/payment', '/orders', '/my-data', '/order-success/:path*', '/track/:path*'];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // URL same rehta hai (/product/3), par page ek hi normal folder se chalta hai
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    ...NOINDEX_PATHS.map((source) => ({
      source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
    })),
    {
      source: '/admin/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    }];
  },
  async rewrites() {
    return [
      { source: '/product/:id', destination: '/product' },
      { source: '/track/:id', destination: '/track' },
      { source: '/order-success/:id', destination: '/order-success' },
    ];
  },
};

export default nextConfig;
