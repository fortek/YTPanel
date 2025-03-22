/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизация изображений
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Настройки webpack для оптимизации бандла
  webpack: (config, { dev, isServer }) => {
    // Настройки для dev режима
    if (dev) {
      // Оптимизация для Fast Refresh
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        runtimeChunk: 'single',
        splitChunks: false,
      }
      // Отключаем source maps в dev режиме
      config.devtool = false
    }
    // Оптимизация для production сборки
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
        },
      }
    }
    return config
  },

  // Отключаем source maps в production
  productionBrowserSourceMaps: false,

  // Настройки для dev режима
  reactStrictMode: true,
  poweredByHeader: false,

  // Настройки для Fast Refresh
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
    webpackBuildWorker: true,
  }
}

module.exports = nextConfig 