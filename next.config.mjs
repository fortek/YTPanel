
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'unsplash.com',
      'pexels.com',
      'pixabay.com',
      'giphy.com',
      'wikimedia.org'
    ]
  }
}

export default nextConfig
