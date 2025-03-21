
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb'
    },
    responseLimit: false
  }
}

export default nextConfig
