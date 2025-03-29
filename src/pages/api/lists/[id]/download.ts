import { NextApiRequest, NextApiResponse } from "next"
import redisClient from "@/lib/redis"
import { Readable } from "stream"

export const config = {
  api: {
    responseLimit: false
  },
}

// Убедимся, что Redis подключен
async function ensureRedisConnection() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

interface CustomReadable extends Readable {
  currentIndex?: number
}

class CookieReadStream extends Readable {
  private currentIndex: number
  private total: number
  private batchSize: number
  private id: string
  private includeEmail: boolean

  constructor(total: number, id: string, includeEmail: boolean, options = {}) {
    super(options)
    this.currentIndex = 0
    this.total = total
    this.batchSize = 1000
    this.id = id
    this.includeEmail = includeEmail
  }

  async _read() {
    if (this.currentIndex >= this.total) {
      this.push(null)
      return
    }

    try {
      const end = Math.min(this.currentIndex + this.batchSize, this.total)
      const pipeline = redisClient.multi()

      // Добавляем команды для текущего батча
      for (let i = this.currentIndex; i < end; i++) {
        const cookieKey = `cookies:${this.id}:${i}`
        pipeline.hGetAll(cookieKey)
      }

      // Выполняем батч
      const results = await pipeline.exec()
      
      if (!results) {
        this.destroy(new Error("Failed to read cookies"))
        return
      }

      // Формируем строки и отправляем в поток
      const lines = results
        .filter(result => result && typeof result === "object")
        .map(result => {
          const cookieData = result as any
          return this.includeEmail 
            ? `${cookieData.cookie}${cookieData.email !== "null" ? `|${cookieData.email}` : ""}\n`
            : `${cookieData.cookie}\n`
        })
        .join("")

      this.push(lines)
      this.currentIndex = end
    } catch (error) {
      this.destroy(error as Error)
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    await ensureRedisConnection()
    
    const { id } = req.query
    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid list ID" })
    }

    const includeEmail = req.query.includeEmail !== "false"

    // Получаем информацию о списке
    const listKey = `list:${id}`
    const listInfo = await redisClient.hGetAll(listKey)
    
    if (!listInfo || !listInfo.total) {
      return res.status(404).json({ message: "List not found" })
    }

    const total = parseInt(listInfo.total)

    // Настраиваем заголовки для скачивания
    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Content-Disposition", `attachment; filename="${id}${includeEmail ? '_with_email' : ''}.txt"`)
    res.setHeader("Transfer-Encoding", "chunked")

    // Создаем поток для чтения
    const readable = new CookieReadStream(total, id, includeEmail)

    // Обрабатываем ошибки потока
    readable.on("error", (error) => {
      console.error("Stream error:", error)
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to download list" })
      }
      res.end()
    })

    // Отправляем данные
    readable.pipe(res)
  } catch (error) {
    console.error("Error downloading list:", error)
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to download list" })
    }
    res.end()
  }
}
