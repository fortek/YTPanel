import { NextApiRequest, NextApiResponse } from "next"
import { saveCookiesToRedis } from "@/lib/redis-utils"
import redisClient, { ensureConnection } from "@/lib/redis"

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1gb'
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { id } = req.query
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "List ID is required" })
  }

  const { accounts } = req.body
  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({ error: "Accounts array is required" })
  }

  try {
    await ensureConnection()
    
    // Проверяем существование списка
    const listKey = `list:${id}`
    const listExists = await redisClient.exists(listKey)
    
    if (!listExists) {
      return res.status(404).json({ error: "List not found" })
    }

    // Получаем текущий total
    const currentTotal = await redisClient.hGet(listKey, 'total')
    if (!currentTotal) {
      return res.status(500).json({ error: "Invalid list state" })
    }

    const startIndex = parseInt(currentTotal)
    const pipeline = redisClient.multi()

    // Добавляем новые записи
    for (let i = 0; i < accounts.length; i++) {
      const [cookie, email] = accounts[i].split("|")
      const cookieKey = `cookies:${id}:${startIndex + i}`
      
      pipeline.hSet(cookieKey, {
        index: (startIndex + i).toString(),
        email: email ? email.trim() : 'null',
        cookie: cookie.trim()
      })
    }

    // Обновляем total
    pipeline.hSet(listKey, 'total', (startIndex + accounts.length).toString())

    // Выполняем все операции
    await pipeline.exec()

    return res.status(200).json({ 
      success: true,
      message: `Added ${accounts.length} accounts to list ${id}`,
      total: startIndex + accounts.length
    })
  } catch (error) {
    console.error("Error appending to list:", error)
    return res.status(500).json({ error: "Failed to append accounts to list" })
  }
} 