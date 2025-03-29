import { createClient } from '@redis/client';
import type { RedisClientType } from '@redis/client';

const redisClient: RedisClientType = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err: Error) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

export const ensureConnection = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient; 