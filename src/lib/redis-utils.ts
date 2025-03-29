import redisClient, { ensureConnection } from './redis';

export interface CookieData {
  name: string;
  cookies: string[];
  emails: (string | null)[];
}

export const saveCookiesToRedis = async (data: CookieData) => {
  try {
    await ensureConnection();
    
    // Сохраняем метаданные списка
    const listKey = `list:${data.name}`;
    await redisClient.hSet(listKey, 'total', data.cookies.length.toString());
    await redisClient.hSet(listKey, 'createdAt', new Date().toISOString());

    // Сохраняем каждую запись как хэш
    for (let i = 0; i < data.cookies.length; i++) {
      const cookieKey = `cookies:${data.name}:${i}`;
      await redisClient.hSet(cookieKey, 'index', i.toString());
      await redisClient.hSet(cookieKey, 'email', data.emails[i] || 'null');
      await redisClient.hSet(cookieKey, 'cookie', data.cookies[i]);
    }

    return true;
  } catch (error) {
    console.error('Error saving cookies to Redis:', error);
    return false;
  }
};

export const getCookiesFromRedis = async (name: string) => {
  try {
    await ensureConnection();
    
    const listKey = `list:${name}`;
    console.log('Getting list info for key:', listKey);
    const listInfo = await redisClient.hGetAll(listKey);
    console.log('List info:', listInfo);
    
    if (!listInfo || Object.keys(listInfo).length === 0) {
      console.error('List not found:', name);
      return null;
    }

    const total = parseInt(listInfo.total);
    console.log('Total cookies:', total);
    
    const batchSize = 5000; // Размер одного батча
    const cookies = [];
    
    // Обрабатываем по частям
    for (let start = 0; start < total; start += batchSize) {
      const end = Math.min(start + batchSize, total);
      const pipeline = redisClient.multi();

      // Добавляем команды для текущего батча
      for (let i = start; i < end; i++) {
        const cookieKey = `cookies:${name}:${i}`;
        pipeline.hGetAll(cookieKey);
      }

      // Выполняем текущий батч
      console.log(`Executing pipeline for cookies ${start} to ${end-1}`);
      const results = await pipeline.exec();
      
      if (!results) {
        console.error('Pipeline execution failed');
        continue;
      }

      // Обрабатываем результаты текущего батча
      const batchCookies = results
        .filter(result => result && typeof result === 'object')
        .map((result) => {
          const cookieData = result as any;
          return {
            index: parseInt(cookieData.index || '0'),
            email: cookieData.email === 'null' ? null : cookieData.email,
            cookie: cookieData.cookie
          };
        });

      cookies.push(...batchCookies);
      console.log(`Processed ${batchCookies.length} cookies in current batch`);
    }

    console.log('Total processed cookies:', cookies.length);
    return {
      name,
      createdAt: listInfo.createdAt,
      total,
      cookies
    };
  } catch (error) {
    console.error('Error getting cookies from Redis:', error);
    return null;
  }
};

export const deleteListFromRedis = async (name: string) => {
  try {
    await ensureConnection();
    
    // Получаем информацию о списке
    const listKey = `list:${name}`;
    const listInfo = await redisClient.hGetAll(listKey);
    
    // Если список не найден, возвращаем true, так как его уже нет
    if (!listInfo.total) return true;

    const total = parseInt(listInfo.total);

    // Удаляем все записи cookies
    const deletePromises = [];
    for (let i = 0; i < total; i++) {
      const cookieKey = `cookies:${name}:${i}`;
      deletePromises.push(redisClient.del(cookieKey));
    }
    await Promise.all(deletePromises);

    // Удаляем метаданные списка
    await redisClient.del(listKey);

    return true;
  } catch (error) {
    console.error('Error deleting list from Redis:', error);
    return false;
  }
};

export const renameListInRedis = async (oldName: string, newName: string) => {
  try {
    await ensureConnection();
    
    // Получаем информацию о старом списке
    const oldListKey = `list:${oldName}`;
    const listInfo = await redisClient.hGetAll(oldListKey);
    
    if (!listInfo.total) return false;

    const total = parseInt(listInfo.total);

    // Создаем новый список
    const newListKey = `list:${newName}`;
    await redisClient.hSet(newListKey, 'total', listInfo.total);
    await redisClient.hSet(newListKey, 'createdAt', listInfo.createdAt);

    // Переносим все cookies
    for (let i = 0; i < total; i++) {
      const oldCookieKey = `cookies:${oldName}:${i}`;
      const newCookieKey = `cookies:${newName}:${i}`;
      
      const cookieData = await redisClient.hGetAll(oldCookieKey);
      if (cookieData) {
        await redisClient.hSet(newCookieKey, 'index', cookieData.index);
        await redisClient.hSet(newCookieKey, 'email', cookieData.email);
        await redisClient.hSet(newCookieKey, 'cookie', cookieData.cookie);
        await redisClient.del(oldCookieKey);
      }
    }

    // Удаляем старый список
    await redisClient.del(oldListKey);

    return true;
  } catch (error) {
    console.error('Error renaming list in Redis:', error);
    return false;
  }
}; 