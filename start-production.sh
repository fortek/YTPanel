#!/bin/bash

# Установка переменных окружения
export NODE_ENV=production
export PORT=3000

# Очистка кэша npm
echo "Clearing npm cache..."
npm cache clean --force

# Установка зависимостей
echo "Installing dependencies..."
npm ci --production

# Сборка приложения
echo "Building application..."
npm run build

# Установка PM2 глобально, если еще не установлен
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Создание директории для логов
mkdir -p logs

# Остановка существующих процессов
echo "Stopping existing processes..."
pm2 delete ytpanel 2>/dev/null || true

# Очистка кэша Node.js
echo "Clearing Node.js cache..."
rm -rf .next/cache

# Запуск приложения через PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Сохранение конфигурации PM2
echo "Saving PM2 configuration..."
pm2 save

# Мониторинг статуса
echo "Application status:"
pm2 status

echo "Production environment is ready!"
echo "Monitor your application with: pm2 monit" 