/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: '/home/node/clawd/clawdx-project/app'
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
}

module.exports = nextConfig
