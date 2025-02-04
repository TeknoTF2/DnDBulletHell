/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure for static export
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
