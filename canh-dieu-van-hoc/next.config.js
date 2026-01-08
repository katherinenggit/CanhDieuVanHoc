/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['https://vizzzczafakdsipdewmy.supabase.co'], // Add your Supabase storage domain
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig