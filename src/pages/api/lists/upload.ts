import { NextApiRequest, NextApiResponse } from "next"
import redis from "@/lib/redis"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1024mb'
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" })
  }

  try {
    const { name, accounts } = req.body

    if (!name || !Array.isArray(accounts)) {
      return res.status(400).json({ error: "Нужно имя списка и массив cookies" })
    }

    const cookies = accounts.map(account => account.trim()).filter(Boolean)
    
    // Генерируем уникальный ID для списка
    const listId = Date.now().toString()
    
    // Сохраняем метаданные списка
    await redis.hmset(`list:${listId}`, 
      'name', name,
      'totalCookies', cookies.length.toString(),
      'createdAt', new Date().toISOString()
    )

    // Сохраняем cookies по одному
    await Promise.all(cookies.map(cookie => 
      redis.rpush(`list:${listId}:cookies`, cookie)
    ))

    return res.status(200).json({ 
      success: true,
      message: `Список ${name} создан с ${cookies.length} cookies`,
      listId
    })
  } catch (error) {
    console.error("Ошибка загрузки:", error)
    return res.status(500).json({ error: "Не удалось загрузить cookies" })
  }
} 