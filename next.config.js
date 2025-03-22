const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизация изображений
  images: {
    domains: ['i.ytimg.com', 'yt3.ggpht.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
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
      };
    }
    // Оптимизация для production сборки
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Добавляем поддержку алиасов путей
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };

    return config;
  },

  // Отключаем source maps в production
  productionBrowserSourceMaps: false,

  // Настройки для dev режима
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,

  // Настройки для Fast Refresh
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
  },

  // Настройки для правильной обработки путей
  basePath: '',
  assetPrefix: '',
};

module.exports = nextConfig;