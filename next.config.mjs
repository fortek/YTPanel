
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
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
