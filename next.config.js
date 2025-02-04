/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable server-side rendering for the entire app
  // since we're using browser APIs
  typescript: false,
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
