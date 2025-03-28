import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.error('Не удалось подключиться к Redis. Убедитесь что Redis запущен на порту 6379')
      return null
    }
    return Math.min(times * 100, 3000)
  }
})

redis.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'ECONNREFUSED') {
    console.error('Redis не запущен. Установите Redis Server:')
    console.error('1. Скачайте Redis для Windows: https://github.com/microsoftarchive/redis/releases')
    console.error('2. Установите Redis-x64-xxx.msi')
    console.error('3. Redis автоматически запустится как Windows сервис')
  }
})

export default redis 