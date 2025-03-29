import { NextApiRequest, NextApiResponse } from "next"
import { saveCookiesToRedis } from "@/lib/redis-utils"
import redisClient, { ensureConnection } from "@/lib/redis"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    },
    responseLimit: '50mb'
  },
}

const CHUNK_TTL = 3600 // 1 час
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 секунда

async function saveChunkWithRetry(key: string, value: string, retries = MAX_RETRIES): Promise<boolean> {
  try {
    await redisClient.set(key, value)
    await redisClient.expire(key, CHUNK_TTL)
    return true
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return saveChunkWithRetry(key, value, retries - 1)
    }
    throw error
  }
}

async function getChunkWithRetry(key: string, retries = MAX_RETRIES): Promise<string | null> {
  try {
    return await redisClient.get(key)
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return getChunkWithRetry(key, retries - 1)
    }
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" })
  }

  try {
    await ensureConnection()
    
    const { name, chunk, chunkIndex, totalChunks } = req.body

    if (!name || chunk === undefined || chunkIndex === undefined || !totalChunks) {
      return res.status(400).json({ error: "Не хватает обязательных параметров" })
    }

    // Проверяем размер чанка
    if (chunk.length > 50 * 1024 * 1024) { // 50MB
      return res.status(413).json({ error: "Размер чанка слишком большой" })
    }

    // Проверяем существование списка
    const listKey = `list:${name}`
    const listExists = await redisClient.exists(listKey)
    if (listExists) {
      return res.status(409).json({ error: "Список с таким именем уже существует" })
    }

    // Сохраняем чанк во временное хранилище Redis
    const chunkKey = `temp:${name}:chunk:${chunkIndex}`
    try {
      const saved = await saveChunkWithRetry(chunkKey, chunk)
      if (!saved) {
        throw new Error("Failed to save chunk")
      }
    } catch (redisError) {
      console.error("Redis error:", redisError)
      return res.status(500).json({ error: "Ошибка сохранения чанка в Redis" })
    }

    // Если это последний чанк, обрабатываем весь файл
    if (chunkIndex === totalChunks - 1) {
      const cookies: string[] = []
      const emails: (string | null)[] = []
      const failedChunks: number[] = []

      // Собираем все чанки
      for (let i = 0; i < totalChunks; i++) {
        const currentChunkKey = `temp:${name}:chunk:${i}`
        try {
          const chunkData = await getChunkWithRetry(currentChunkKey)
          
          if (!chunkData) {
            failedChunks.push(i)
            continue
          }

          // Обрабатываем строки из чанка
          const lines = chunkData.split("\n").filter(line => line.trim())
          for (const line of lines) {
            const [cookie, email] = line.split("|")
            cookies.push(cookie.trim())
            emails.push(email ? email.trim() : null)
          }

          // Удаляем обработанный чанк
          await redisClient.del(currentChunkKey)
        } catch (error) {
          console.error(`Error processing chunk ${i}:`, error)
          failedChunks.push(i)
        }
      }

      // Если есть неудачные чанки, возвращаем ошибку
      if (failedChunks.length > 0) {
        return res.status(500).json({ 
          error: "Не удалось обработать все чанки",
          failedChunks
        })
      }

      // Сохраняем в Redis
      const success = await saveCookiesToRedis({
        name,
        cookies,
        emails
      })

      if (!success) {
        throw new Error("Не удалось сохранить cookies в Redis")
      }

      return res.status(200).json({ 
        success: true,
        message: `Список ${name} создан с ${cookies.length} cookies`,
        total: cookies.length,
        id: name,
        isComplete: true
      })
    }

    // Если это не последний чанк, просто подтверждаем получение
    return res.status(200).json({ 
      success: true,
      message: `Чанк ${chunkIndex} получен`,
      isComplete: false
    })

  } catch (error) {
    console.error("Ошибка загрузки:", error)
    
    // Очищаем временные данные при ошибке
    if (req.body?.name) {
      const pattern = `temp:${req.body.name}:chunk:*`
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(keys)
      }
    }
    
    return res.status(500).json({ error: "Не удалось загрузить cookies" })
  }
} 