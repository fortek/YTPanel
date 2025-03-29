/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['sharp']
  },
  api: {
    bodyParser: {
      sizeLimit: '1024mb'
    },
    responseLimit: '1024mb'
  },
  webpack: (config, { dev, isServer }) => {
    // Увеличиваем лимиты для режима разработки
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/.git/**', '**/node_modules/**'],
      }
    }
    return config
  },
  async headers() {
    return [
      {
        source: "/api/static/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain",
          },
        ],
      },
      {
        source: "/api/lists/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
          {
            key: "Content-Length",
            value: "1073741824", // 1GB в байтах
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/uploaded_cookies",
        destination: "/api/files",
      },
      {
        source: "/uploaded_cookies/:path*",
        destination: "/api/static/:path*",
      },
    ]
  },
}

export default nextConfig
