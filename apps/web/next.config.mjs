/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sipaka/types', '@sipaka/legal-engine'],
  async rewrites() {
    const apiDestination = process.env.INTERNAL_API_URL || 'http://localhost:4000/api/:path*';
    return [
      {
        source: '/api/:path*',
        destination: apiDestination,
      },
    ];
  },
};

export default nextConfig;
