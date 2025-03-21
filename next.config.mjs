
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
