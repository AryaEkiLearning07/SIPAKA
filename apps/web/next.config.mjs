/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sipaka/types', '@sipaka/legal-engine'],
  async rewrites() {
    const rawTarget = process.env.INTERNAL_API_URL || 'http://api:4000/api/:path*';
    const apiDestination = rawTarget.includes(':path*')
      ? rawTarget
      : `${rawTarget.replace(/\/api\/?$/, '')}/api/:path*`;
    return [
      {
        source: '/api/:path*',
        destination: apiDestination,
      },
    ];
  },
};

export default nextConfig;
