/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // URL same rehta hai (/product/3), par page ek hi normal folder se chalta hai
  async rewrites() {
    return [
      { source: '/product/:id', destination: '/product' },
      { source: '/track/:id', destination: '/track' },
      { source: '/order-success/:id', destination: '/order-success' },
    ];
  },
};

export default nextConfig;
