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
        minimize: false,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        sideEffects: false,
      }
      // Отключаем source maps в dev режиме для ускорения
      config.devtool = false
    }
    // Оптимизация для production сборки
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        // Оптимизация JavaScript
        minimize: true,
        // Разделение чанков
        splitChunks: {
          chunks: 'all',
          // Минимальный размер чанка
          minSize: 20000,
          // Максимальный размер чанка
          maxSize: 244000,
          // Минимальное количество чанков
          minChunks: 1,
          // Максимальное количество параллельных запросов
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
}

module.exports = nextConfig 