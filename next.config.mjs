
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  api: {
    bodyParser: {
      sizeLimit: "500mb"
    },
    responseLimit: "500mb"
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
